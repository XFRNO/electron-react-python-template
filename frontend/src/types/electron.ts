export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  selectFolder: () => Promise<string | null>;
  selectFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>;
  showItemInFolder: (path: string) => Promise<void>;
  apiCall: (endpoint: string, options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  }) => Promise<any>;
  createWebSocket: (endpoint: string) => WebSocket;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};