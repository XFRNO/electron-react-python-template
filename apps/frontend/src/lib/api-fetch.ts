import { isElectron } from "./utils";

const getBaseUrl = async () => {
  if (isElectron()) {
    // In Electron, get the backend port from the main process
    const port = await window.electron.getBackendPort();
    return `http://127.0.0.1:${port}`;
  } else {
    // In web, assume the proxy is set up for /api
    return "/api";
  }
};

export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
};