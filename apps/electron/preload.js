const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  getPorts: () => ipcRenderer.invoke("get-ports"),
  getAppInfo: () => ipcRenderer.invoke("get-app-info"),
  getBackendInfo: () => ipcRenderer.invoke("get-backend-info"),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  selectFile: (options) => ipcRenderer.invoke("select-file", options),
  apiCall: (endpoint, options) =>
    ipcRenderer.invoke("api-call", endpoint, options),
});
