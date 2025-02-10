// src/components/MarkdownModal.js
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";
import * as Utils from "../functions";

function MarkdownModal({
  selectedMarkdown,
  currentPath,
  rawBaseUrl,
  closeModal,
  modalContentRef,
  handleLinkClick,
  copyToClipboard,
}) {
  return (
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
        <div ref={modalContentRef}>
          <ReactMarkdown
            children={selectedMarkdown}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: (props) => <Utils.Heading {...props} />,
              h2: (props) => <Utils.Heading {...props} />,
              h3: (props) => <Utils.Heading {...props} />,
              h4: (props) => <Utils.Heading {...props} />,
              h5: (props) => <Utils.Heading {...props} />,
              h6: (props) => <Utils.Heading {...props} />,
              blockquote: (props) => <Utils.Blockquote {...props} />,
              p: ({ children }) => <p style={Utils.customStyles.p}>{children}</p>,
              ul: ({ children }) => <ul style={Utils.customStyles.ul}>{children}</ul>,
              ol: ({ children }) => <ol style={Utils.customStyles.ol}>{children}</ol>,
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
                    style={{
                      width: "100%",
                      maxHeight: "400px",
                      objectFit: "contain",
                    }}
                  />
                );
              },
              a: ({ node, ...props }) => {
                const href = props.href;
                if (href.match(/\.(mp4|webm|ogg)$/i)) {
                  const videoUrl = href.startsWith("http")
                    ? href
                    : `${rawBaseUrl}${currentPath}${encodeURIComponent(href)}`;
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
                  } else {
                    return (
                      <p>Link de vídeo do YouTube inválido ou não encontrado.</p>
                    );
                  }
                }
                if (href.startsWith("#")) {
                  return (
                    <a
                      href={href}
                      onClick={(e) => {
                        e.preventDefault();
                        const targetId = decodeURIComponent(href.slice(1));
                        const element = modalContentRef.current.querySelector(
                          `#${targetId}`
                        );
                        if (element) {
                          element.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        } else {
                          console.error(
                            `Elemento com ID "${targetId}" não encontrado!`
                          );
                        }
                      }}
                    >
                      {props.children}
                    </a>
                  );
                }
                if (!href.startsWith("http")) {
                  return (
                    <a href={href} onClick={(e) => handleLinkClick(href, e)}>
                      {props.children}
                    </a>
                  );
                }
                let child = null;
                try {
                  child = React.Children.only(props.children);
                } catch (e) {}
                if (child && child.props && child.props.src) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {props.children}
                    </a>
                  );
                }
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {props.children}
                  </a>
                );
              },
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
                  return (
                    <p style={{ color: "red" }}>
                      Erro: vídeo sem caminho especificado.
                    </p>
                  );
                }
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
              code: ({ inline, className, children, ...props }) => {
                if (inline) {
                  return (
                    <code
                      style={{
                        backgroundColor: "#f5cc00",
                        padding: "2px 4px",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                        color: "#000",
                        display: "inline-block",
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                const match = /language-(\w+)/.exec(className || "");
                if (match && match[1] === "mermaid") {
                  return (
                    <Utils.MermaidRenderer
                      code={String(children).replace(/\n$/, "")}
                    />
                  );
                }
                return match ? (
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
                      language={match[1]}
                      style={solarizedlight}
                      showLineNumbers
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <pre
                    style={{
                      backgroundColor: "transparent",
                      padding: 0,
                      margin: 0,
                      display: "inline-block",
                    }}
                  >
                    <code
                      {...props}
                      style={{
                        backgroundColor: "#f5cc00",
                        padding: "2px 4px",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                        color: "#000",
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
  );
}

export default MarkdownModal;