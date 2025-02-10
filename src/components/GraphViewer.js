// src/components/GraphViewer.js
import React from "react";
import { ForceGraph2D } from "react-force-graph";

function GraphViewer({ graphData, activeNode, onNodeClick }) {
  return (
    <ForceGraph2D
      graphData={graphData}
      nodeLabel="id"
      nodeColor={(node) =>
        node.id === activeNode ? "#ff4444" : node.color || "#000"
      }
      onNodeClick={onNodeClick}
    />
  );
}

export default GraphViewer;