export interface ElectronAPI {
  getPorts: () => Promise<{
    frontendPort: number | null;
    backendPort: number | null;
  }>;
  getAppInfo: () => Promise<{ name: string; version: string; isDev: boolean }>;
  getBackendInfo: () => Promise<{
    backendPort: number | null;
    url: string;
    status: string;
  }>;
  selectFolder: () => Promise<string | null>;
  selectFile: (options: {
    filters: { name: string; extensions: string[] }[];
  }) => Promise<string | null>;
  apiCall: (
    endpoint: string,
    options?: {
      method?: string;
      body?: any;
    }
  ) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
