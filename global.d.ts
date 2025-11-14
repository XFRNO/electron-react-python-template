interface Window {
  electron: {
    process: {
      versions: NodeJS.ProcessVersions;
    };
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => void;
    };
    getPorts: () => Promise<{ frontendPort: number; backendPort: number }>;
    getAppInfo: () => Promise<{
      name: string;
      version: string;
      isDev: boolean;
    }>;
    getBackendInfo: () => Promise<{
      backendPort: number | null;
      url: string;
      status: string;
    }>;
    selectFolder: () => Promise<{
      success: boolean;
      path?: string;
      error?: string;
    }>;
    apiCall: (endpoint: string, options?: RequestInit) => Promise<any>;
    verifyLicense: (
      licenseKey: string
    ) => Promise<{ success: boolean; error?: string; details?: any }>;
    clearLicense: () => Promise<{ success: boolean; error?: string }>;
    restartApp: () => Promise<{ success: boolean; error?: string }>;
    showItemInFolder: (
      path: string
    ) => Promise<{ success: boolean; error?: string }>;
    getSettings: () => Promise<any>;
    updateSettings: (settings: Record<string, any>) => Promise<any>;
    onLicenseError: (
      callback: (errorTitle: string, errorMessage: string) => void
    ) => () => void;
    ping: () => Promise<string>;
  };
}
