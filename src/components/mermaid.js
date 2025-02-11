import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";

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

  return <div ref={containerRef} className="mermaid-container" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export { MermaidRenderer };