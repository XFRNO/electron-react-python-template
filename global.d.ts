interface Window {
  electron: {
    getBackendPort: () => Promise<number>;
    ping: () => Promise<string>;
    getPorts: () => Promise<any>;
    getAppInfo: () => Promise<any>;
    getBackendInfo: () => Promise<any>;
    apiCall: (endpoint: string, options?: RequestInit) => Promise<any>;
  };
}
