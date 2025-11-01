const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  getPorts: () => {
    return ipcRenderer.invoke("get-ports");
  },
  getAppInfo: () => {
    return ipcRenderer.invoke("get-app-info");
  },
  getBackendInfo: () => {
    return ipcRenderer.invoke("get-backend-info");
  },
  selectFolder: () => {
    return ipcRenderer.invoke("select-download-folder");
  },
  selectFile: (options) => {
    return ipcRenderer.invoke("select-file", options);
  },
  apiCall: (endpoint, options) => {
    return ipcRenderer.invoke("api-call", endpoint, options);
  },
  createWebSocket: async (endpoint) => {
    try {
      const wsUrl = await ipcRenderer.invoke("create-websocket", endpoint);
      return new WebSocket(wsUrl);
    } catch (error) {
      throw error;
    }
  },
  // Add license verification method
  verifyLicense: (licenseKey) => {
    return ipcRenderer.invoke("verify-license", licenseKey);
  },
  // Add license clearing method
  clearLicense: () => {
    return ipcRenderer.invoke("clear-license");
  },
  // Add app restart method
  restartApp: () => {
    return ipcRenderer.invoke("restart-app");
  },
  showItemInFolder: (path) => {
    return ipcRenderer.invoke("show-item-in-folder", path);
  },
  // Add settings methods
  getSettings: () => {
    return ipcRenderer.invoke("get-settings");
  },
  updateSetting: (key, value) => {
    return ipcRenderer.invoke("update-setting", key, value);
  },
  updateSettings: (settings) => {
    return ipcRenderer.invoke("update-settings", settings);
  },
  // Add license error listener
  onLicenseError: (callback) => {
    // Use ipcRenderer.on for receiving events from main process
    const handler = (event, errorTitle, errorMessage) => {
      callback(errorTitle, errorMessage);
    };
    ipcRenderer.on("license-error", handler);

    // Return a function to remove the listener
    return () => {
      ipcRenderer.removeListener("license-error", handler);
    };
  },
  // Add openExternal method
  openExternal: (url) => {
    return ipcRenderer.invoke("open-external-url", url);
  },

  ping: () => {
    return ipcRenderer.invoke("ping");
  },
});
