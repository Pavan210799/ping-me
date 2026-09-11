function apiBase() {
  return String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
}

export function apiUrl(path: string) {
  return apiBase() + path;
}

export function mediaUrl(path: string) {
  if (!path || /^(https?:|data:|blob:)/i.test(path)) {
    return path;
  }
  return apiBase() + path;
}

export function socketUrl() {
  const base = apiBase();
  if (base) {
    const url = new URL(base);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws";
    url.search = "";
    url.hash = "";
    return url.toString();
  }

  if (window.location.protocol === "https:") {
    return "wss://" + window.location.host + "/ws";
  }
  return "ws://" + window.location.host + "/ws";
}
