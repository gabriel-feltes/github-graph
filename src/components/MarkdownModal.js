import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";
import * as Utils from "../functions";
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
  handleCopyToClipboard
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

                // Se for um link para um arquivo de vídeo
                if (/\.(mp4|webm|ogg)$/i.test(href)) {
                  const videoUrl = href.startsWith("http")
                    ? href
                    : `${rawBaseUrl}${currentPath}${encodeURIComponent(href)}`;
                  return (
                    <video src={videoUrl} controls className="video-responsive">
                      Seu navegador não suporta vídeos.
                    </video>
                  );
                }

                // Se for um link para um vídeo do YouTube
                if (Utils.isYouTubeLink(href)) {
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
                  return (
                    <div>
                      Link de vídeo do YouTube inválido ou não encontrado.
                    </div>
                  );
                }

                // Caso seja um link padrão
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
              // Renderização de blocos de código e código inline
              code: ({ inline, className, children, ...props }) => {
                if (inline) {
                  return <code {...props}>{children}</code>;
                }

                const codeContent = String(children).replace(/\n$/, "");
                const match = /language-(\w+)/.exec(className || "");

                // Renderiza o diagrama Mermaid se a linguagem for "mermaid"
                if (match && match[1] === "mermaid") {
                  return <MermaidRenderer code={codeContent} />;
                }

                // Renderização com syntax highlighter para linguagens reconhecidas
                if (match) {
                  return (
                    <div className="code-block">
                      <button
                        onClick={() => handleCopyToClipboard && handleCopyToClipboard(children)} // Usando o nome correto da função
                        className="copy-btn"
                      >
                        Copiar
                      </button>

                      <SyntaxHighlighter
                        language={match[1]}
                        style={solarizedlight}
                        showLineNumbers
                      >
                        {codeContent}
                      </SyntaxHighlighter>
                    </div>
                  );
                }

                // Fallback para blocos de código sem linguagem especificada
                return (
                  <pre>
                    <code {...props}>{children}</code>
                  </pre>
                );
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MarkdownModal;