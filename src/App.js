import React, { useEffect, useState } from "react";
import { ForceGraph2D } from "react-force-graph";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";

const GITHUB_REPO = "Liga-IA/RepoAI";
const RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/`;

// Função para substituir espaços por "%20"
const encodeURL = (url) => url.replace(/ /g, "%20");

// Se o link (ou src) começar com "/" ele é relativo à raiz do repositório.
const fixPath = (path, currentPath = "") => {
  if (path.startsWith("/")) {
    return path.slice(1); // remove a barra inicial
  }
  return currentPath + path;
};

// Função para detectar links do YouTube
const isYouTubeLink = (url) => /youtube\.com|youtu\.be/.test(url);

/**
 * Constroi o grafo em árvore a partir da árvore do GitHub.
 * – Cria nós para cada diretório e arquivo Markdown.
 * – Agrupa os nós especiais (os com nomes "repoAI-template", "tutoriais" e "README.md"
 *   que estão diretamente sob o root) sob um nó único chamado "Documentação".
 * – Propaga a propriedade especial para todos os descendentes desses nós.
 * – Atribui cores: nós especiais (e seus descendentes) recebem a cor especial (laranja);
 *   os demais, a cor padrão (azul).
 */
const buildTreeGraph = (treeArray) => {
  let nodes = [];
  let links = [];
  const nodeMap = {};

  // Função para criar um nó (caso ainda não exista)
  const addNode = (id, name, type) => {
    if (!nodeMap[id]) {
      const node = { id, name, type, special: false };
      nodes.push(node);
      nodeMap[id] = node;
    }
  };

  // Cria o nó raiz
  addNode("root", "Repositório", "folder");

  // Filtra arquivos Markdown
  const markdownFiles = treeArray.filter((item) => item.path.endsWith(".md"));

  // Para cada arquivo Markdown, cria nós para os diretórios e para o arquivo
  for (const file of markdownFiles) {
    const parts = file.path.split("/");
    let parent = "root";
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      if (i < parts.length - 1) {
        // Diretório
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        addNode(currentPath, parts[i], "folder");
        links.push({ source: parent, target: currentPath });
        parent = currentPath;
      } else {
        // Arquivo Markdown
        const fileId = file.path;
        addNode(fileId, parts[i], "file");
        links.push({ source: parent, target: fileId });
      }
    }
  }

  // Definindo os nomes especiais
  const specialKeys = new Set(["repoAI-template", "tutoriais", "README.md"]);
  // Cria o nó "Documentação"
  const docId = "documentacao";
  const docNode = { id: docId, name: "Documentação", type: "folder", special: true };
  nodes.push(docNode);
  nodeMap[docId] = docNode;
  // Liga "Documentação" como filho do root
  links.push({ source: "root", target: docId });

  // Reatribui os nós especiais que estão diretamente sob "root"
  for (let i = links.length - 1; i >= 0; i--) {
    const link = links[i];
    // Se o nó filho (a parte final do caminho) for um dos especiais
    // (para pastas, usamos o último segmento; para arquivos, o nome completo)
    const childIdParts = link.target.split("/");
    const childName = childIdParts[childIdParts.length - 1];
    if (link.source === "root" && specialKeys.has(childName)) {
      links.splice(i, 1);
      links.push({ source: docId, target: link.target });
      if (nodeMap[link.target]) {
        nodeMap[link.target].special = true;
      }
    }
  }

  // Propaga a propriedade "special" para todos os descendentes
  let changed = true;
  while (changed) {
    changed = false;
    for (const link of links) {
      if (nodeMap[link.source] && nodeMap[link.source].special && !nodeMap[link.target].special) {
        nodeMap[link.target].special = true;
        changed = true;
      }
    }
  }

  // Define as cores: nós especiais (e seus descendentes) recebem uma cor única, os demais outra.
  const specialColor = "#ff9900"; // laranja para Documentação e seus filhos
  const defaultColor = "#00aaff"; // azul para os demais
  nodes = nodes.map((node) => {
    node.color = node.special ? specialColor : defaultColor;
    return node;
  });

  return { nodes, links };
};

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedMarkdown, setSelectedMarkdown] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  // Busca a estrutura do repositório via API do GitHub e constrói o grafo
  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/trees/main?recursive=1`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.tree) return;
        const treeGraph = buildTreeGraph(data.tree);
        setGraphData(treeGraph);
      })
      .catch((error) => console.error("Erro ao buscar estrutura do repositório:", error));
  }, []);

  // Quando um nó (arquivo Markdown) é clicado, carrega e exibe seu conteúdo
  const handleNodeClick = async (node) => {
    if (node.id.endsWith(".md")) {
      const markdownUrl = `${RAW_BASE_URL}${node.id}`;
      try {
        const response = await fetch(markdownUrl);
        let markdown = await response.text();
        const markdownDir = node.id.substring(0, node.id.lastIndexOf("/") + 1);
        // Ajusta caminhos de imagens relativos no Markdown:
        markdown = markdown.replace(
          /!\[([^\]]*)\]\((?!http)(.*?)\)/g,
          (match, alt, src) => {
            const fixedSrc = fixPath(src, markdownDir);
            return `![${alt}](${encodeURL(RAW_BASE_URL + fixedSrc)})`;
          }
        );
        setSelectedMarkdown(markdown);
        setCurrentPath(markdownDir);
        setIsModalOpen(true);
      } catch (error) {
        console.error("Erro ao carregar Markdown:", error);
      }
    }
  };

  // Função que intercepta cliques em links relativos no Markdown
  const handleLinkClick = (href, e) => {
    e.preventDefault();
    // Remove a barra inicial se existir e decodifica
    const fixedHref = decodeURIComponent(href.startsWith("/") ? href.slice(1) : href);
    const targetNode = graphData.nodes.find((n) => n.id === fixedHref);
    if (targetNode) {
      handleNodeClick(targetNode);
    } else {
      console.error("Nó não encontrado para href:", fixedHref);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Código copiado!");
    });
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Lado esquerdo: Grafo em árvore do repositório */}
      <div style={{ width: "50%" }}>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="id"
          nodeColor={(node) => node.color}
          onNodeClick={handleNodeClick}
        />
      </div>

      {/* Modal para exibir o conteúdo Markdown */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "800px",
              width: "80%",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                padding: "5px 10px",
                border: "none",
                backgroundColor: "#ff4444",
                color: "#fff",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Fechar
            </button>

            <ReactMarkdown
              children={selectedMarkdown}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                // Imagens: se o src começar com "/" usa a raiz; caso contrário, usa currentPath
                img: ({ node, ...props }) => {
                  const fixedSrc = fixPath(props.src, currentPath);
                  const imageUrl = encodeURL(
                    props.src.startsWith("http")
                      ? props.src
                      : `${RAW_BASE_URL}${fixedSrc}`
                  );
                  return (
                    <img
                      {...props}
                      src={imageUrl}
                      alt={props.alt || "image"}
                      style={{ width: "100%", maxHeight: "400px", objectFit: "contain" }}
                    />
                  );
                },
                // Links: se for relativo, intercepta o clique para carregar o nó correspondente no grafo.
                a: ({ node, ...props }) => {
                  const href = props.href;
                  const childrenArray = React.Children.toArray(props.children);
                  if (!href.startsWith("http")) {
                    // Link relativo: chama handleLinkClick
                    return (
                      <a href={href} onClick={(e) => handleLinkClick(href, e)}>
                        {props.children}
                      </a>
                    );
                  }
                  // Se o link envolver uma imagem, renderiza a imagem clicável
                  if (
                    childrenArray.length === 1 &&
                    childrenArray[0].props &&
                    childrenArray[0].props.src
                  ) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {props.children}
                      </a>
                    );
                  }
                  // Se for um link puro (texto)
                  if (childrenArray.length === 1 && typeof childrenArray[0] === "string") {
                    // Se o href aponta para um arquivo de vídeo local
                    if (href.match(/\.(mp4|webm|ogg)$/i)) {
                      const videoUrl = href.startsWith("http")
                        ? href
                        : `${RAW_BASE_URL}${currentPath}${encodeURIComponent(href)}`;
                      return (
                        <video
                          src={videoUrl}
                          controls
                          style={{ width: "100%", maxHeight: "400px" }}
                        >
                          Seu navegador não suporta vídeos.
                        </video>
                      );
                    }
                    // Se for um link puro para YouTube, embute o vídeo
                  if (isYouTubeLink(href)) {
                    let videoId = null;

                    // Verifica se o link é do tipo youtube.com
                    if (href.includes('youtube.com')) {
                      videoId = new URL(href).searchParams.get('v');
                    }
                    // Verifica se o link é do tipo youtu.be
                    else if (href.includes('youtu.be')) {
                      const urlParts = href.split('/');
                      videoId = urlParts[urlParts.length - 1];
                    }

                    // Caso o videoId tenha sido extraído corretamente, renderiza o iframe
                    if (videoId) {
                      return (
                        <div
                          style={{
                            width: "100%",
                            position: "relative",
                            paddingBottom: "56.25%", // Proporção 16:9
                            height: 0,
                            overflow: "hidden",
                          }}
                        >
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Video YouTube"
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                            }}
                          />
                        </div>
                      );
                    } else {
                      return <p>Link de vídeo do YouTube inválido ou não encontrado.</p>;
                    }
                  }
                }
                // Caso contrário, renderiza o link normalmente
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {props.children}
                    </a>
                  );
                },
                // Vídeos: tenta extrair o src de <source> se necessário
                video: ({ node, children, ...props }) => {
                  let src = props.src;
                  if (!src && children) {
                    React.Children.forEach(children, (child) => {
                      if (child && child.props && child.props.src) {
                        src = child.props.src;
                      }
                    });
                  }
                  if (!src) {
                    return <p style={{ color: "red" }}>Erro: vídeo sem caminho especificado.</p>;
                  }
                  const videoUrl = src.startsWith("http")
                    ? src
                    : `${RAW_BASE_URL}${currentPath}${encodeURIComponent(src)}`;
                  return (
                    <video
                      {...props}
                      src={videoUrl}
                      controls
                      style={{ width: "100%", maxHeight: "400px" }}
                    >
                      Seu navegador não suporta vídeos.
                    </video>
                  );
                },
                // Blocos de código com botão "Copiar"
                code: ({ node, inline, className, children }) => {
                  if (inline) {
                    return <code className={className}>{children}</code>;
                  }
                  const language = className?.replace("language-", "");
                  return (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => copyToClipboard(children)}
                        style={{
                          position: "absolute",
                          top: "5px",
                          right: "5px",
                          padding: "2px 6px",
                          fontSize: "12px",
                          backgroundColor: "#333",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Copiar
                      </button>
                      <SyntaxHighlighter language={language} style={solarizedlight}>
                        {children}
                      </SyntaxHighlighter>
                    </div>
                  );
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
