import { IpcRendererEvent } from "electron";

export interface ElectronAPI {
  getAppInfo: () => Promise<any>;
  apiCall: <T>(url: string, data?: any) => Promise<T>;
  createWebSocket: () => WebSocket; // Added createWebSocket method
  on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
  off: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
