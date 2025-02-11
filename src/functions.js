// --- Helpers ---
const encodeURL = (url) => url.replace(/ /g, "%20");

const fixPath = (path, currentPath = "") => {
  return path.startsWith("/") ? path.slice(1) : currentPath + path;
};

const isYouTubeLink = (url) => /youtube\.com|youtu\.be/.test(url);

export { 
    encodeURL, 
    fixPath, 
    isYouTubeLink
};
