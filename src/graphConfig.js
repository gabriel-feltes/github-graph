// --- Função para construir o grafo da árvore do repositório ---
const buildTreeGraph = (treeArray) => {
  let nodes = [];
  let links = [];
  const nodeMap = {};

  const addNode = (id, name, type) => {
    if (!nodeMap[id]) {
      const node = { id, name, type, special: false };
      nodes.push(node);
      nodeMap[id] = node;
    }
  };

  // Nó raiz
  addNode("root", "Repositório", "folder");

  const markdownFiles = treeArray.filter((item) => item.path.endsWith(".md"));

  for (const file of markdownFiles) {
    const parts = file.path.split("/");
    let parent = "root";
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      if (i < parts.length - 1) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        addNode(currentPath, parts[i], "folder");
        links.push({ source: parent, target: currentPath });
        parent = currentPath;
      } else {
        const fileId = file.path;
        addNode(fileId, parts[i], "file");
        links.push({ source: parent, target: fileId });
      }
    }
  }

  const specialKeys = new Set(["repoAI-template", "tutoriais", "README.md"]);
  const docId = "documentacao";
  const docNode = { id: docId, name: "Documentação", type: "folder", special: true };
  nodes.push(docNode);
  nodeMap[docId] = docNode;
  links.push({ source: "root", target: docId });

  for (let i = links.length - 1; i >= 0; i--) {
    const link = links[i];
    const childIdParts = link.target.split("/");
    const childName = childIdParts[childIdParts.length - 1];
    if (link.source === "root" && specialKeys.has(childName)) {
      links.splice(i, 1);
      links.push({ source: docId, target: link.target });
      if (nodeMap[link.target]) {
        nodeMap[link.target].special = true;
      }
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const link of links) {
      if (nodeMap[link.source] && nodeMap[link.source].special && !nodeMap[link.target].special) {
        nodeMap[link.target].special = true;
        changed = true;
      }
    }
  }

  const specialColor = "#ff9900";
  const defaultColor = "#00aaff";
  nodes = nodes.map((node) => {
    node.color = node.special ? specialColor : defaultColor;
    return node;
  });

  return { nodes, links };
};

export { buildTreeGraph };