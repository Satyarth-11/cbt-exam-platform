/**
 * Helper to construct proper WebSocket URL for both local dev and production (Netlify + Render).
 */
export const getWebSocketUrl = (path: string): string => {
  // 1. Explicit WS override variable (e.g. VITE_WS_BASE_URL=wss://cbt-backend.onrender.com/ws/proctor)
  const envWsUrl = (import.meta as any).env?.VITE_WS_BASE_URL;
  if (envWsUrl && typeof envWsUrl === 'string' && envWsUrl.trim() !== '') {
    return envWsUrl.trim();
  }

  // 2. Derive from VITE_API_BASE_URL if set (e.g. https://cbt-backend.onrender.com/api/v1 -> wss://cbt-backend.onrender.com/ws/proctor)
  const envApiUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.startsWith('http')) {
    try {
      const urlObj = new URL(envApiUrl);
      const wsProtocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${urlObj.host}${path}`;
    } catch (e) {
      console.error('Failed to parse VITE_API_BASE_URL for WebSocket derivation:', e);
    }
  }

  // 3. Fallback for local development via Nginx / Localhost
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  const host = window.location.host.includes(':3000') ? 'localhost:8080' : window.location.host;
  return `${protocol}${host}${path}`;
};
