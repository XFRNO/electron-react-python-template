import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  getPorts: (): Promise<{ frontendPort: number; backendPort: number }> => {
    return ipcRenderer.invoke("get-ports");
  },
  getAppInfo: (): Promise<{ name: string; version: string }> => {
    return ipcRenderer.invoke("get-app-info");
  },
  getBackendInfo: (): Promise<{ port: number | null }> => {
    return ipcRenderer.invoke("get-backend-info");
  },
  selectFolder: (): Promise<string | undefined> => {
    return ipcRenderer.invoke("select-download-folder");
  },
  selectFile: (options: Electron.OpenDialogOptions): Promise<string | undefined> => {
    return ipcRenderer.invoke("select-file", options);
  },
  apiCall: (endpoint: string, options?: RequestInit): Promise<any> => {
    return ipcRenderer.invoke("api-call", endpoint, options);
  },
  createWebSocket: async (endpoint: string): Promise<WebSocket> => {
    try {
      const wsUrl: string = await ipcRenderer.invoke("create-websocket", endpoint);
      return new WebSocket(wsUrl);
    } catch (error) {
      throw error;
    }
  },
  // Add license verification method
  verifyLicense: (licenseKey: string): Promise<boolean> => {
    return ipcRenderer.invoke("verify-license", licenseKey);
  },
  // Add license clearing method
  clearLicense: (): Promise<void> => {
    return ipcRenderer.invoke("clear-license");
  },
  // Add app restart method
  restartApp: (): Promise<void> => {
    return ipcRenderer.invoke("restart-app");
  },
  showItemInFolder: (path: string): Promise<void> => {
    return ipcRenderer.invoke("show-item-in-folder", path);
  },
  // Add settings methods
  getSettings: (): Promise<Record<string, any>> => {
    return ipcRenderer.invoke("get-settings");
  },
  updateSetting: (key: string, value: any): Promise<void> => {
    return ipcRenderer.invoke("update-setting", key, value);
  },
  updateSettings: (settings: Record<string, any>): Promise<void> => {
    return ipcRenderer.invoke("update-settings", settings);
  },
  // Add license error listener
  onLicenseError: (callback: (errorTitle: string, errorMessage: string) => void) => (): void => {
    // Use ipcRenderer.on for receiving events from main process
    const handler = (event: Electron.IpcRendererEvent, errorTitle: string, errorMessage: string) => {
      callback(errorTitle, errorMessage);
    };
    ipcRenderer.on("license-error", handler);

    // Return a function to remove the listener
    return () => {
      ipcRenderer.removeListener("license-error", handler);
    };
  },
  // Add openExternal method
  openExternal: (url: string): Promise<void> => {
    return ipcRenderer.invoke("open-external-url", url);
  },

  ping: (): Promise<string> => {
    return ipcRenderer.invoke("ping");
  },
});

declare global {
  interface Window {
    electron: {
      getPorts: () => Promise<{ frontendPort: number; backendPort: number }>;
      getAppInfo: () => Promise<{ name: string; version: string }>;
      getBackendInfo: () => Promise<{ port: number | null }>;
      selectFolder: () => Promise<string | undefined>;
      selectFile: (options: Electron.OpenDialogOptions) => Promise<string | undefined>;
      apiCall: (endpoint: string, options?: RequestInit) => Promise<any>;
      createWebSocket: (endpoint: string) => Promise<WebSocket>;
      verifyLicense: (licenseKey: string) => Promise<boolean>;
      clearLicense: () => Promise<void>;
      restartApp: () => Promise<void>;
      showItemInFolder: (path: string) => Promise<void>;
      getSettings: () => Promise<Record<string, any>>;
      updateSetting: (key: string, value: any) => Promise<void>;
      updateSettings: (settings: Record<string, any>) => Promise<void>;
      onLicenseError: (callback: (errorTitle: string, errorMessage: string) => void) => () => void;
      openExternal: (url: string) => Promise<void>;
      ping: () => Promise<string>;
    };
  }
}
