/**
 * Configuration management for the phone frontend
 *
 * Uses VITE_API_URL / VITE_WS_URL when set, otherwise derives the backend
 * URL from the current browser hostname so the app works from any device
 * on the same network (phone, tablet, other PC) without config changes.
 */

interface Config {
  apiUrl: string;
  wsUrl: string;
}

function deriveApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '' && !envUrl.includes('localhost')) {
    return envUrl;
  }
  // When accessed from another device, window.location.hostname is the
  // server's IP. Replace localhost in the env URL with that hostname.
  const host = window.location.hostname;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.replace('localhost', host);
  }
  return `http://${host}:8080`;
}

function deriveWsUrl(): string {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl && envUrl.trim() !== '' && !envUrl.includes('localhost')) {
    return envUrl;
  }
  const host = window.location.hostname;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.replace('localhost', host);
  }
  return `ws://${host}:8080/ws`;
}

function loadConfig(): Config {
  return {
    apiUrl: deriveApiUrl(),
    wsUrl: deriveWsUrl(),
  };
}

export const config: Config = loadConfig();
export const { apiUrl, wsUrl } = config;
