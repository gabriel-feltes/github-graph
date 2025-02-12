import React, { useEffect, useRef, useState } from "react";
import { ForceGraph2D } from "react-force-graph";
import { forceCollide } from "d3-force";

const IMAGE_PATH = "/assets/nodes/"; // Pasta na public onde ficam as imagens
const DISTANCIA_MAXIMA = 400; // Distância personalizada entre "documentação" e "repositório"

function GraphViewer({ graphData, activeNode, onNodeClick }) {
  const fgRef = useRef(null);
  const imageCache = useRef({});
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Atualiza a posição do tooltip conforme o mouse se move sobre o canvas
  useEffect(() => {
    // Observe que usamos a propriedade "canvas" (sem parênteses)
    const canvas = fgRef.current?.canvas;
    if (!canvas) return;
    const handleMouseMove = (e) => {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    };
    canvas.addEventListener("mousemove", handleMouseMove);
    return () => canvas.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Configura as forças do grafo e adiciona uma força de colisão
  useEffect(() => {
    if (fgRef.current) {
      const graph = fgRef.current;
      // Aumenta um pouco a repulsão para separar os nós
      graph.d3Force("charge").strength(-80);
      // Define distâncias: para a ligação entre "documentação" e "repositório" usamos DISTANCIA_MAXIMA
      graph.d3Force("link").distance((link) => {
        const sourceName = link.source.name.toLowerCase();
        const targetName = link.target.name.toLowerCase();
        if (
          (sourceName === "documentação" && targetName === "repositório") ||
          (sourceName === "repositório" && targetName === "documentação")
        ) {
          return DISTANCIA_MAXIMA;
        }
        return 100;
      });
      // Força de colisão para evitar sobreposição dos nós
      graph.d3Force("collide", forceCollide(30));
      graph.d3ReheatSimulation();
    }
  }, [graphData]);

  // Função para ajustar a posição do texto, evitando sobreposição com outros nós
  const avoidTextOverlap = (node) => {
    const offsetY = 20;
    for (let other of graphData.nodes) {
      if (other.id !== node.id) {
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 40) {
          return node.y > other.y ? offsetY : -offsetY;
        }
      }
    }
    return 0;
  };

  return (
    <div style={{ position: "relative" }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        onNodeHover={(node) => setHoveredNode(node)}
        onNodeClick={onNodeClick}
        nodeCanvasObjectMode={() => "replace"}
        nodeCanvasObject={(node, ctx, globalScale) => {
          // Define os tipos de nó
          const isMarkdown = node.id.endsWith(".md");
          const isSpecialFolder =
            node.name.toLowerCase() === "documentação" ||
            node.name.toLowerCase() === "repositório";
          // Exibe o nome sem a extensão .md para arquivos Markdown
          const label = isMarkdown ? node.name.replace(/\.md$/, "") : node.name;
          // Vamos representar com círculo: se for Markdown, pastas especiais ou se o nó tiver cor azul
          const shouldDrawCircle =
            isMarkdown || isSpecialFolder || node.color === "blue";
          const radius = isMarkdown ? 14 : 20;
          const imageSize = radius * 2;
          const textOffsetY = avoidTextOverlap(node);

          // Efeito de halo quando o nó está em hover
          if (hoveredNode && hoveredNode.id === node.id) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI, false);
            ctx.fillStyle = "rgba(255, 165, 0, 0.3)"; // Halo laranja semitransparente
            ctx.fill();
            ctx.restore();
          }

          if (shouldDrawCircle) {
            // Define a origem da imagem:
            // Se o nó tiver propriedade "img", usa-a; se for azul e não houver "img", usa uma imagem default.
            let imgSrc = null;
            if (node.img) {
              imgSrc = `${IMAGE_PATH}${node.img}`;
            } else if (node.color === "blue") {
              imgSrc = `${IMAGE_PATH}default-blue-node.png`;
            }
            if (imgSrc) {
              if (!imageCache.current[imgSrc]) {
                const img = new Image();
                img.src = imgSrc;
                img.onload = () => {
                  imageCache.current[imgSrc] = img;
                  fgRef.current?.refresh();
                };
              } else {
                // Desenha a imagem com recorte circular (clipping)
                ctx.save();
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(
                  imageCache.current[imgSrc],
                  node.x - radius,
                  node.y - radius,
                  imageSize,
                  imageSize
                );
                ctx.restore();
              }
            } else {
              // Se não houver imagem, desenha o círculo normalmente
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.color || "#000";
              ctx.fill();
              ctx.strokeStyle = "#222";
              ctx.lineWidth = 3;
              ctx.stroke();
            }
          }

          // Define o estilo do texto:
          // Pastas especiais ("documentação" e "repositório") em negrito 18px,
          // Markdown em negrito 16px e os demais em 14px normal
          const fontSize = isSpecialFolder ? 18 : isMarkdown ? 16 : 14;
          const fontWeight = isSpecialFolder || isMarkdown ? "bold" : "normal";
          ctx.font = `${fontWeight} ${fontSize}px Sans-Serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "black";
          ctx.fillText(label, node.x, node.y + radius + 12 + textOffsetY);
        }}
        // Amplia a área de clique dos nós
        nodePointerAreaPaint={(node, color, ctx) => {
          const pointerRadius = 25;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pointerRadius, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        // Desenha os links com um gradiente menos intenso (de Tomato a Steel Blue)
        linkCanvasObject={(link, ctx) => {
          const start = link.source;
          const end = link.target;
        
          // Certifica-se de que os valores x e y são numéricos antes de desenhar
          if (
            isNaN(start?.x) || isNaN(start?.y) ||
            isNaN(end?.x) || isNaN(end?.y)
          ) {
            return; // Evita erro se houver valores inválidos
          }
        
          const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
          grad.addColorStop(0, "#FF6347"); // Tomato
          grad.addColorStop(1, "#4682B4"); // Steel Blue
        
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }}
        
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.1}
      />

      {/* Tooltip customizado que segue o mouse */}
      {hoveredNode && (
        <div
          style={{
            position: "absolute",
            top: tooltipPos.y + 10,
            left: tooltipPos.x + 10,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "5px 8px",
            borderRadius: "4px",
            pointerEvents: "none",
            fontSize: "12px",
            whiteSpace: "nowrap",
            zIndex: 10,
          }}
        >
          {hoveredNode.name}
        </div>
      )}
    </div>
  );
}

export default GraphViewer;
