// Type definitions for Electron API

export interface ElectronAPI {
  getAppInfo: () => Promise<{
    name: string;
    version: string;
    isDev: boolean;
  }>;
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>;
  createWebSocket: (endpoint: string) => Promise<WebSocket>;
  // Add more Electron API methods as needed
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
