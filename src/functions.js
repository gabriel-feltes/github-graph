import mermaid from "mermaid";
import { FaLink } from 'react-icons/fa';  // Importando o ícone de link
import React, { useRef, useState, useEffect } from "react";

// --- Helpers ---
const encodeURL = (url) => url.replace(/ /g, "%20");

const fixPath = (path, currentPath = "") => {
  return path.startsWith("/") ? path.slice(1) : currentPath + path;
};

const isYouTubeLink = (url) => /youtube\.com|youtu\.be/.test(url);

// --- Functions ---

// Função para gerar slug (id) a partir do texto da heading.
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

export { 
    encodeURL, 
    fixPath, 
    isYouTubeLink, 
    Heading, 
    Blockquote, 
    MermaidRenderer,
    customStyles
};
  