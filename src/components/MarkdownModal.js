import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";
import * as Utils from "./functions";
import { Heading } from "./heading";
import { MermaidRenderer } from "./mermaid";
import "../App.css";

const MarkdownModal = ({
  selectedMarkdown,
  currentPath,
  rawBaseUrl,
  closeModal,
  modalContentRef,
  handleLinkClick,
  copyToClipboard
}) => {
  // Componente para headings (h1-h6)
  const HeadingComponent = (props) => <Heading {...props} />;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={closeModal} className="close-btn">
          Fechar
        </button>
        <div ref={modalContentRef}>
          <ReactMarkdown
            children={selectedMarkdown}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              // Utiliza o mesmo componente para todos os headings
              h1: (props) => <HeadingComponent level={1} {...props} />,
              h2: (props) => <HeadingComponent level={2} {...props} />,
              h3: (props) => <HeadingComponent level={3} {...props} />,
              h4: (props) => <HeadingComponent level={4} {...props} />,
              h5: (props) => <HeadingComponent level={5} {...props} />,
              h6: (props) => <HeadingComponent level={6} {...props} />,
              // Elementos de texto e listas
              p: ({ children }) => <p>{children}</p>,
              ul: ({ children }) => <ul>{children}</ul>,
              ol: ({ children }) => <ol>{children}</ol>,
              // Renderização de imagens com ajuste de URL
              img: ({ node, ...props }) => {
                const fixedSrc = Utils.fixPath(props.src, currentPath);
                const imageUrl = Utils.encodeURL(
                  props.src.startsWith("http")
                    ? props.src
                    : `${rawBaseUrl}${fixedSrc}`
                );
                return (
                  <img
                    {...props}
                    src={imageUrl}
                    alt={props.alt || "image"}
                    className="img-responsive"
                  />
                );
              },
              // Renderização de links, vídeos e embeds do YouTube
              a: ({ node, ...props }) => {
                const { href, children } = props;
              
                // Tenta detectar se há uma imagem entre os filhos usando o "node" (a árvore de AST)
                const nodeContainsImage =
                  node &&
                  Array.isArray(node.children) &&
                  node.children.some(child => child && child.tagName === 'img');
              
                // Caso contrário, tenta detectar usando os elementos React já renderizados
                const childrenContainImage = React.Children.toArray(children).some(
                  (child) => child && (child.type === 'img' || child.props?.src)
                );
              
                const containsImage = nodeContainsImage || childrenContainImage;
              
                // Se o link contém uma imagem, renderiza apenas o link com essa imagem
                if (containsImage) {
                  return (
                    <a href={href} onClick={(e) => handleLinkClick(href, e)}>
                      {children}
                    </a>
                  );
                }
              
                // Se não há imagem, então verifica se o link é do YouTube
                const isYouTubeLink = Utils.isYouTubeLink(href);
                if (isYouTubeLink) {
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
                  }
                }
              
                // Se o link é para um arquivo de vídeo (mp4, webm, ogg)
                if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(href)) {
                  const videoUrl = href.startsWith("http")
                    ? href
                    : `${rawBaseUrl}${currentPath}${encodeURIComponent(href)}`;
                  return (
                    <video src={videoUrl} controls className="video-responsive">
                      Seu navegador não suporta vídeos.
                    </video>
                  );
                }
              
                // Caso não seja nenhum dos casos anteriores, renderiza o link normalmente
                return (
                  <a href={href} onClick={(e) => handleLinkClick(href, e)}>
                    {children}
                  </a>
                );
              },              
              video: ({ node, children, ...props }) => {
                let src = props.src;
              
                // Verificar se o src está dentro de children, como no caso de imagens
                if (!src && children) {
                  React.Children.forEach(children, (child) => {
                    if (child && child.props && child.props.src) {
                      src = child.props.src;
                    }
                  });
                }
              
                if (!src) {
                  return (
                    <p style={{ color: "red" }}>
                      Erro: vídeo sem caminho especificado.
                    </p>
                  );
                }
              
                // Resolver o caminho para vídeos locais
                const videoUrl = src.startsWith("http")
                  ? src
                  : `${rawBaseUrl}${currentPath}${encodeURIComponent(src)}`;
              
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
              // Renderização de blocos de código
              code: ({ className, children, ...props }) => {
                // Verifica se "children" é uma string com quebras de linha (indicando bloco de código)
                const isBlockCode = typeof children === "string" && children.includes("\n");
              
                if (isBlockCode) {
                  // Tenta extrair o idioma do className (ex: "language-python")
                  const match = className ? /language-(\w+)/.exec(className) : null;
                  let language = match ? match[1] : null;
              
                  // Se for "mermaid", renderiza com o MermaidRenderer
                  if (language === "mermaid") {
                    return (
                      <MermaidRenderer code={String(children).replace(/\n$/, "")} />
                    );
                  }
              
                  // Se não houver linguagem definida no bloco, default para "bash"
                  if (!language) {
                    language = "bash";
                  }
              
                  // Renderiza o bloco de código com SyntaxHighlighter e botão de copiar
                  return (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => copyToClipboard(children)}
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          backgroundColor: "#4CAF50",
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
                        language={language}
                        style={solarizedlight}
                        showLineNumbers
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  );
                } else {
                  // Caso contrário, trata-se de código inline – renderiza sem destaque especial nem botão
                  return (
                    <code
                      {...props}
                      style={{
                        backgroundColor: "yellow",
                        padding: "0",
                        margin: "0",
                        fontFamily: "monospace",
                        color: "black",
                      }}
                    >
                      {children}
                    </code>
                  );
                }
              },
              // Renderização personalizada para tabelas
              table: ({ children }) => (
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
                  {children}
                </table>
              ),
              th: ({ children }) => (
                <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', textAlign: 'left' }}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                  {children}
                </td>
              ),
              // Renderização personalizada para sub
              sub: ({ children }) => (
                <sub style={{ display: 'block', textAlign: 'center' }}>
                  {children}
                </sub>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MarkdownModal;