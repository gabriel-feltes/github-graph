// Função para processar e renderizar alertas do Markdown (removendo "> " do tipo e do conteúdo)
const processAlerts = (markdown) => {
  return markdown.replace(
    /^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)/gim,
    (_, type, text) => {
      const alertClasses = {
        NOTE: "alert-note",
        TIP: "alert-tip",
        IMPORTANT: "alert-important",
        WARNING: "alert-warning",
        CAUTION: "alert-caution",
      };

      const alertEmojis = {
        NOTE: "📌", // Dica importante, algo a ser lembrado
        TIP: "💡", // Ilumina o caminho, uma sugestão inteligente
        IMPORTANT: "🚨", // Urgente, atenção necessária
        WARNING: "⚠️", // Alerta de possível perigo ou erro
        CAUTION: "🛑", // Cuidado, algo que precisa ser evitado
      };

      // Remover "> " tanto do tipo quanto do texto do alerta
      const cleanText = text.replace(/^> /, "").trim(); // Remove "> " do texto do alerta

      return `<div class="alert ${alertClasses[type]}">
        <strong>${alertEmojis[type]} ${type}:</strong><br/><br/> ${cleanText}
      </div><br/>`;
    }
  );
};

export default processAlerts;