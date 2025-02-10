// src/hooks/useRepoData.js
import { useState, useEffect } from "react";
import { buildTreeGraph } from "../graphConfig";

export default function useRepoData(repo, branch) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.tree) return;
        const treeGraph = buildTreeGraph(data.tree);
        setGraphData(treeGraph);
      })
      .catch((error) =>
        console.error("Erro ao buscar estrutura do repositório:", error)
      );
  }, [repo, branch]);

  return graphData;
}