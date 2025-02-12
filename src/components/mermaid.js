import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";
import "../App.css"; // Importa estilos personalizados

mermaid.initialize({ startOnLoad: false, theme: "default" });

function MermaidRenderer({ code }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [svg, setSvg] = useState("");
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.style.transform = `translate(${position.x}px, ${position.y}px) scale(${scale})`;
    }
  }, [scale, position]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev / 1.2, 0.5));
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleFullscreenToggle = () => setIsFullscreen(!isFullscreen);

  const handleMouseDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    containerRef.current.classList.add("dragging");  // Aplicar o estilo de cursor "grabbing"
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
    containerRef.current.classList.remove("dragging");  // Remover o estilo de cursor
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      alert("Código Mermaid copiado para a área de transferência!");
    }).catch((err) => console.error("Erro ao copiar código:", err));
  };

  return (
    <div className={`mermaid-wrapper ${isFullscreen ? "fullscreen" : ""}`}>
      {/* Botões flutuantes estilo controle remoto */}
      <div className="mermaid-toolbar">
        <button onClick={handleZoomIn} title="Aumentar Zoom">➕</button>
        <button onClick={handleZoomOut} title="Diminuir Zoom">➖</button>
        <button onClick={handleResetZoom} title="Resetar Zoom">🔄</button>
        <button onClick={handleFullscreenToggle} title="Tela Cheia">
          {isFullscreen ? "⏏" : "⛶"}
        </button>
        <button onClick={handleCopyCode} title="Copiar Código">📋</button>
      </div>

      {/* Área do diagrama */}
      <div
        ref={containerRef}
        className="mermaid-container"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseDown={handleMouseDown}
      >
        <div
          dangerouslySetInnerHTML={{ __html: svg }}
          className="mermaid-svg"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        />
      </div>
    </div>
  );
}

export { MermaidRenderer };