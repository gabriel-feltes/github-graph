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

  // Filtra apenas os arquivos Markdown
  const markdownFiles = treeArray.filter((item) => item.path.endsWith(".md"));

  // Função para extrair o título do conteúdo Markdown
  const extractTitle = (markdownContent, defaultTitle) => {
    if (!markdownContent) return defaultTitle;
    // Separa o conteúdo em linhas e procura a primeira linha que comece com "# "
    const lines = markdownContent.split('\n');
    for (let line of lines) {
      if (line.trim().startsWith('# ')) {
        // Remove o marcador "# " e espaços extras
        return line.replace(/^#\s+/, '').trim();
      }
    }
    // Se não encontrar, retorna o título padrão (nome do arquivo)
    return defaultTitle;
  };

  // Processa cada arquivo Markdown
  for (const file of markdownFiles) {
    const parts = file.path.split("/");
    let parent = "root";
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      if (i < parts.length - 1) {
        // Para cada parte do caminho que não é o arquivo, cria um nó de pasta
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        addNode(currentPath, parts[i], "folder");
        links.push({ source: parent, target: currentPath });
        parent = currentPath;
      } else {
        // Última parte: o arquivo Markdown
        const fileId = file.path;
        const defaultTitle = parts[i];
        // Usa o título extraído do conteúdo ou, se não houver, o nome do arquivo
        const title = extractTitle(file.content, defaultTitle);
        addNode(fileId, title, "file");
        links.push({ source: parent, target: fileId });
      }
    }
  }

  // Processamento de nós especiais
  const specialKeys = new Set(["repoAI-template", "tutoriais", "README.md"]);
  const docId = "documentacao";
  const docNode = { id: docId, name: "Documentação", type: "folder", special: true };
  nodes.push(docNode);
  nodeMap[docId] = docNode;
  links.push({ source: "root", target: docId });

  // Realoca nós especiais para estarem sob "Documentação"
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

  // Propaga a propriedade "special" para nós descendentes
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

  // Define as cores dos nós
  const specialColor = "#ff9900";
  const defaultColor = "#00aaff";
  nodes = nodes.map((node) => {
    node.color = node.special ? specialColor : defaultColor;
    return node;
  });

  return { nodes, links };
};

export { buildTreeGraph };