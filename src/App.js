import React, { useEffect, useState, useRef } from "react";
import { ForceGraph2D } from "react-force-graph";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";
import mermaid from "mermaid";
import { FaLink } from 'react-icons/fa';  // Importando o ícone de link

const GITHUB_REPO = "Liga-IA/RepoAI";
const RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/`;

// --- Helpers ---
const encodeURL = (url) => url.replace(/ /g, "%20");

const fixPath = (path, currentPath = "") => {
  return path.startsWith("/") ? path.slice(1) : currentPath + path;
};

const isYouTubeLink = (url) => /youtube\.com|youtu\.be/.test(url);

// Função para gerar slug (id) a partir do texto da heading.
// Removemos escapes desnecessários.
function slugify(text) {
  return text
    .toString()
    .trim() // Remove espaços extras no início e no fim
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/[^\w\-ãáâàéêíóôúãõç]+/g, '') // Remove caracteres não alfanuméricos, mas mantém acentuação
    .toLowerCase(); // Converte para minúsculas
}

// --- Componentes Customizados para ReactMarkdown ---
// Componente customizado para headings com estilo adicional
function Heading({ level, children, ...props }) {
  const childrenArray = Array.isArray(children) ? children : [children];
  const text = childrenArray
    .map((child) => (typeof child === 'string' ? child : ''))
    .join('');
  const id = slugify(text); // Gera o ID usando a função slugify
  const Tag = 'h' + level; // Cria a tag dinamicamente (h1, h2, h3, etc.)

  return (
    <Tag id={id} {...props} style={{
      position: 'relative',
      paddingRight: '20px',
      marginBottom: '1em', // Adiciona espaçamento abaixo do título
      paddingTop: level === 1 ? '20px' : '10px', // Mais espaço para títulos maiores
      borderBottom: '2px solid #ddd', // Linha inferior para separar os títulos
    }}>
      {children}
      <a
        href={`#${id}`}
        aria-label={`Link para o título ${children}`} // Acessibilidade adicional
        style={{
          position: 'absolute',
          right: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          textDecoration: 'underline',
          color: '#0366d6',
          opacity: '1',
          fontSize: '0.8em',
          marginLeft: '8px',
          transition: 'opacity 0.2s',
        }}
      >
        <FaLink />
      </a>
    </Tag>
  );
}

// Adicionando mais espaçamento aos parágrafos, listas e blockquotes
const customStyles = {
  p: {
    marginBottom: '1.5em', // Maior espaçamento entre parágrafos
  },
  ul: {
    marginBottom: '1.5em', // Maior espaçamento entre listas
    paddingLeft: '20px',
  },
  ol: {
    marginBottom: '1.5em', // Maior espaçamento entre listas ordenadas
    paddingLeft: '20px',
  },
  blockquote: {
    marginBottom: '1.5em', // Maior espaçamento entre blockquotes
    paddingLeft: '20px',
    borderLeft: '4px solid #ccc', // Linha de separação
    backgroundColor: '#f4f4f4', // Fundo leve para blockquotes
  },
};

// Componente customizado para blockquotes que renderiza alertas
function Blockquote({ children, ...props }) {
  let alertType = null;
  let newChildren = children;

  if (Array.isArray(children) && children.length > 0) {
    const firstChild = children[0];
    if (
      firstChild &&
      firstChild.props &&
      firstChild.props.children &&
      typeof firstChild.props.children[0] === "string"
    ) {
      const firstChildText = firstChild.props.children[0];
      const match = firstChildText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/);
      if (match) {
        alertType = match[1];
        const newText = firstChildText.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/, "");
        const newFirstChild = React.cloneElement(firstChild, {
          children: [newText, ...(firstChild.props.children.slice(1) || [])],
        });
        newChildren = [newFirstChild, ...children.slice(1)];
      }
    }
  }

  if (alertType) {
    let style = {};
    switch (alertType) {
      case "NOTE":
        style = {
          borderLeft: "4px solid #1e90ff",
          background: "#e7f3fe",
          padding: "0.5em 1em",
          margin: "1em 0",
        };
        break;
      case "TIP":
        style = {
          borderLeft: "4px solid #28a745",
          background: "#eafaf1",
          padding: "0.5em 1em",
          margin: "1em 0",
        };
        break;
      case "IMPORTANT":
        style = {
          borderLeft: "4px solid #fd7e14",
          background: "#fff4e5",
          padding: "0.5em 1em",
          margin: "1em 0",
        };
        break;
      case "WARNING":
        style = {
          borderLeft: "4px solid #dc3545",
          background: "#f8d7da",
          padding: "0.5em 1em",
          margin: "1em 0",
        };
        break;
      case "CAUTION":
        style = {
          borderLeft: "4px solid #ffc107",
          background: "#fff3cd",
          padding: "0.5em 1em",
          margin: "1em 0",
        };
        break;
      default:
        style = { borderLeft: "4px solid #ccc", padding: "0.5em 1em", margin: "1em 0" };
    }
    return <div style={style}>{newChildren}</div>;
  }

  return <blockquote {...props}>{children}</blockquote>;
}

// --- Componente para renderizar diagramas Mermaid ---
mermaid.initialize({ startOnLoad: false, theme: "default" });

function MermaidRenderer({ code }) {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState("");

  useEffect(() => {
    if (!code || !containerRef.current) return;

    const renderMermaid = async () => {
      try {
        const uniqueId = "mermaid-" + Math.random().toString(36).substr(2, 9);
        const { svg } = await mermaid.render(uniqueId, code);
        setSvg(svg);
      } catch (error) {
        console.error("Erro ao renderizar Mermaid:", error);
        setSvg(`<pre style="color:red;">Erro ao processar diagrama Mermaid</pre>`);
      }
    };

    renderMermaid();
  }, [code]);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: svg }} />;
}

// --- Função para construir o grafo da árvore do repositório ---
const buildTreeGraph = (treeArray) => {
  let nodes = [];
  let links = [];
  const nodeMap = {};

  const addNode = (id, name, type) => {
    if (!nodeMap[id]) {
      const node = { id, name, type, special: false };
      nodes.push(node);
      nodeMap[id] = node;
    }
  };

  // Nó raiz
  addNode("root", "Repositório", "folder");

  const markdownFiles = treeArray.filter((item) => item.path.endsWith(".md"));

  for (const file of markdownFiles) {
    const parts = file.path.split("/");
    let parent = "root";
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      if (i < parts.length - 1) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        addNode(currentPath, parts[i], "folder");
        links.push({ source: parent, target: currentPath });
        parent = currentPath;
      } else {
        const fileId = file.path;
        addNode(fileId, parts[i], "file");
        links.push({ source: parent, target: fileId });
      }
    }
  }

  const specialKeys = new Set(["repoAI-template", "tutoriais", "README.md"]);
  const docId = "documentacao";
  const docNode = { id: docId, name: "Documentação", type: "folder", special: true };
  nodes.push(docNode);
  nodeMap[docId] = docNode;
  links.push({ source: "root", target: docId });

  for (let i = links.length - 1; i >= 0; i--) {
    const link = links[i];
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

  const specialColor = "#ff9900";
  const defaultColor = "#00aaff";
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
  const modalContentRef = React.useRef(null);  // Cria uma referência para o diálogo

  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/trees/main?recursive=1`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.tree) return;
        const treeGraph = buildTreeGraph(data.tree);
        setGraphData(treeGraph);
      })
      .catch((error) =>
        console.error("Erro ao buscar estrutura do repositório:", error)
      );
  }, []);

  // Adicionar estado para o nó ativo
const [activeNode, setActiveNode] = useState(null);

// Modificar a função de clique no nó
const handleNodeClick = async (node) => {
  setActiveNode(node.id);  // Marca o nó clicado como ativo
  if (node.id.endsWith(".md")) {
    const markdownUrl = `${RAW_BASE_URL}${node.id}`;
    try {
      const response = await fetch(markdownUrl);
      let markdown = await response.text();
      const markdownDir = node.id.substring(0, node.id.lastIndexOf("/") + 1);
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
  
  const handleLinkClick = (href, e) => {
    e.preventDefault();
    const fixedHref = decodeURIComponent(href.startsWith("/") ? href.slice(1) : href);
    const targetNode = graphData.nodes.find((n) => n.id === fixedHref);
    
    if (targetNode) {
      handleNodeClick(targetNode); // Navega para o nó correspondente no grafo
    } else {
      // Se for link de âncora, faz a navegação suave
      if (href.startsWith('#')) {
        const targetId = decodeURIComponent(href.slice(1)); // Decodifica o ID
        const element = modalContentRef.current.querySelector(`#${targetId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          console.error(`Elemento com ID "${targetId}" não encontrado!`);
        }
      }
      else {
        console.error("Nó não encontrado para href:", fixedHref);
      }
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
      {/* Lado esquerdo: Grafo do repositório */}
      <div style={{ width: "50%" }}>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="id"
        nodeColor={(node) => node.id === activeNode ? "#ff4444" : node.color}  // Destaca o nó ativo
        onNodeClick={handleNodeClick}
      />
      </div>
      {/* Modal para exibição do Markdown */}
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
              {/* Aqui o ref é aplicado no conteúdo do modal */}
                <div ref={modalContentRef}>
            <ReactMarkdown
              children={selectedMarkdown}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: (props) => <Heading {...props} />,
                h2: (props) => <Heading {...props} />,
                h3: (props) => <Heading {...props} />,
                h4: (props) => <Heading {...props} />,
                h5: (props) => <Heading {...props} />,
                h6: (props) => <Heading {...props} />,
                blockquote: (props) => <Blockquote {...props} />,
                p: ({ children }) => <p style={customStyles.p}>{children}</p>,
                ul: ({ children }) => <ul style={customStyles.ul}>{children}</ul>,
                ol: ({ children }) => <ol style={customStyles.ol}>{children}</ol>,
                // Renderização de imagens
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
                      style={{
                        width: "100%",
                        maxHeight: "400px",
                        objectFit: "contain",
                      }}
                    />
                  );
                },
                // Renderização de links com suporte para:
                // - Vídeos locais
                // - Vídeos do YouTube
                // - Links de âncora (rolagem suave)
                // - Links relativos para nós do grafo
                a: ({ node, ...props }) => {
                  const href = props.href;
                  // Se for link para arquivo de vídeo
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
                  // Se for link para YouTube
                  if (isYouTubeLink(href)) {
                    let videoId = null;
                    if (href.includes("youtube.com")) {
                      videoId = new URL(href).searchParams.get("v");
                    } else if (href.includes("youtu.be")) {
                      const urlParts = href.split("/");
                      videoId = urlParts[urlParts.length - 1];
                    }
                    if (videoId) {
                      return (
                        <div
                          style={{
                            width: "100%",
                            position: "relative",
                            paddingBottom: "56.25%",
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
                  // Se for link âncora (inicia com "#"), rola suavemente até o elemento
                  if (href.startsWith('#')) {
                    return (
                      <a
                        href={href}
                        onClick={(e) => {
                          e.preventDefault();
                          const targetId = decodeURIComponent(href.slice(1)); // Decodifica o ID
                          const element = modalContentRef.current.querySelector(`#${targetId}`);
                      
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          } else {
                            console.error(`Elemento com ID "${targetId}" não encontrado!`);
                          }
                        }}
                      >
                        {props.children}
                      </a>
                    );
                  }
                  // Se for link relativo (não começa com "http")
                  if (!href.startsWith("http")) {
                    return (
                      <a href={href} onClick={(e) => handleLinkClick(href, e)}>
                        {props.children}
                      </a>
                    );
                  }
                  // Se o link envolver exatamente um filho e esse filho possuir a prop src (ex.: imagem)
                  let child = null;
                  try {
                    child = React.Children.only(props.children);
                  } catch (e) {
                    // Se houver mais de um filho, ignore essa verificação
                  }
                  if (child && child.props && child.props.src) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {props.children}
                      </a>
                    );
                  }
                  // Caso contrário, link externo padrão
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {props.children}
                    </a>
                  );
                },
                // Renderização de elemento <video> se declarado diretamente no Markdown.
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
                // Bloco de código com botão "Copiar"
                code: ({ inline, className, children, ...props }) => {
                  // Quando o código for inline
                  if (inline) {
                    return (
                      <code
                      style={{
                        backgroundColor: "#f5cc00 !important", // Cor de fundo com !important
                        padding: "2px 4px",                    // Padding para dar espaço entre o texto
                        borderRadius: "4px",                   // Arredondar as bordas
                        fontFamily: "monospace",                // Fonte monoespaçada
                        color: "#000",                         // Cor do texto
                        display: "inline-block",               // Força o código inline
                      }}
                      {...props}
                    >
                        {children}
                      </code>
                    );
                  }
                  // Caso contrário, se for um bloco de código
                  const match = /language-(\w+)/.exec(className || "");
                  // Se for um bloco Mermaid, renderiza o diagrama
                  if (match && match[1] === "mermaid") {
                    return <MermaidRenderer code={String(children).replace(/\n$/, "")} />;
                  }
                  return match ? (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => copyToClipboard(children)}
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          backgroundColor: "#4CAF50", // Cor do botão
                          color: "white",
                          padding: "5px 10px",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                      >
                        Copiar
                      </button>
                      <SyntaxHighlighter
                        language={match[1]}
                        style={solarizedlight}
                        showLineNumbers={true}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <pre style={{
                      backgroundColor: "transparent", // Sem cor de fundo no <pre>
                      padding: 0,                      // Remove o padding extra do <pre>
                      margin: 0,                       // Remove qualquer margem
                      display: "inline-block",         // Mantém o código inline (não pula para a próxima linha)
                    }}>
                      <code
                        {...props}
                        style={{
                          backgroundColor: "#f5cc00",   // Cor de fundo amarela apenas no <code>
                          padding: "2px 4px",            // Padding pequeno para não afastar o texto da borda
                          borderRadius: "4px",           // Borda arredondada
                          fontFamily: "monospace",        // Fonte monoespaçada
                          color: "#000",                 // Cor do texto
                        }}
                      >
                        {children}
                      </code>
                    </pre>
                  );
                },
              }}
            />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default App;