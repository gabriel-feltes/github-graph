import React, { useState, useRef } from "react";
import GraphViewer from "./components/graphViewer";
import MarkdownModal from "./components/MarkdownModal";
import useRepoData from "./hooks/useRepoData";
import * as Utils from "./components/functions";
import processAlerts from "./components/processAlerts";
import "./App.css";

const GITHUB_REPO = "Liga-IA/RepoIA";
const BRANCH = "main";
const RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/${BRANCH}/`;

function App() {
  const [selectedMarkdown, setSelectedMarkdown] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [activeNode, setActiveNode] = useState(null);
  const modalContentRef = useRef(null);

  // Obtém os dados do repositório via hook customizado
  const graphData = useRepoData(GITHUB_REPO, BRANCH);

  // Função para lidar com o clique em um nó do grafo
  const handleNodeClick = async (node) => {
    setActiveNode(node.id);
    if (node.id.endsWith(".md")) {
      const markdownUrl = `${RAW_BASE_URL}${node.id}`;
      try {
        const response = await fetch(markdownUrl);
        let markdown = await response.text();
        const markdownDir =
          node.id.substring(0, node.id.lastIndexOf("/") + 1);
        // Corrige os caminhos das imagens
        markdown = markdown.replace(
          /!\[([^\]]*)\]\((?!http)(.*?)\)/g,
          (match, alt, src) => {
            const fixedSrc = Utils.fixPath(src, markdownDir);
            return `![${alt}](${Utils.encodeURL(RAW_BASE_URL + fixedSrc)})`;
          }
        );
        markdown = processAlerts(markdown);
        setSelectedMarkdown(markdown);
        setCurrentPath(markdownDir);
        setIsModalOpen(true);
      } catch (error) {
        console.error("Erro ao carregar Markdown:", error);
      }
    }
  };

  // Função para lidar com cliques em links do Markdown
  const handleLinkClick = (href, e) => {
    e.preventDefault();
    const fixedHref = decodeURIComponent(
      href.startsWith("/") ? href.slice(1) : href
    );
  
    // Novo código para lidar com links externos
    if (fixedHref.startsWith('http://') || fixedHref.startsWith('https://')) {
      window.open(fixedHref, '_blank');  // Abre em nova aba
      return;
    }
  
    const targetNode = graphData.nodes.find((n) => n.id === fixedHref);
  
    if (targetNode) {
      handleNodeClick(targetNode);
    } else {
      if (href.startsWith("#")) {
        const targetId = decodeURIComponent(href.slice(1));
        const element = modalContentRef.current.querySelector(
          `#${targetId}`
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          console.error(`Elemento com ID "${targetId}" não encontrado!`);
        }
      } else {
        console.error("Nó não encontrado para href:", fixedHref);
      }
    }
  };

  // Função para fechar o modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Função para copiar texto para a área de transferência
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Lado esquerdo: Grafo do repositório */}
      <div style={{ width: "50%" }}>
        <GraphViewer
          graphData={graphData}
          activeNode={activeNode}
          onNodeClick={handleNodeClick}
        />
      </div>
      {/* Modal para exibir o Markdown */}
      {isModalOpen && (
        <MarkdownModal
          selectedMarkdown={selectedMarkdown}
          currentPath={currentPath}
          rawBaseUrl={RAW_BASE_URL}
          closeModal={closeModal}
          modalContentRef={modalContentRef}
          handleLinkClick={handleLinkClick}
          copyToClipboard={copyToClipboard}
        />
      )}
    </div>
  );
}

export default App;