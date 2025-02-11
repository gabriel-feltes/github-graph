import React from "react";
import { ForceGraph2D } from "react-force-graph";

function graphViewer({ graphData, activeNode, onNodeClick }) {
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

export default graphViewer;