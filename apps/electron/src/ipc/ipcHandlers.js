const { ipcMain, shell, dialog, BrowserWindow, app } = require("electron");
const { Logger } = require("../utils/logger");
const {
  resetWindowManagerState,
  resetRefreshState,
} = require("../windows/windowManager");
const { settingsManager } = require("../utils/settingsManager");

// Import license manager functions
const {
  verifyLicense,
  setLicenseValid,
  openMainAppWindow,
} = require("../lib/licenseManager");

/**
 * Sets up all IPC handlers for the application
 * @param {Object} licenseManager - License manager instance (for backward compatibility)
 * @param {Function} createWindow - Function to create main window
 * @param {boolean} isDev - Development mode flag
 */
function setupIpcHandlers(createWindow, isDev) {
  // Get ports information
  ipcMain.handle("get-ports", () => {
    // Import here to avoid circular dependency
    const { getBackendPort } = require("../backend/backendManager");
    const { getFrontendPort } = require("../frontend/frontendManager");
    return {
      frontendPort: getFrontendPort(),
      backendPort: getBackendPort(),
    };
  });

  // License verification
  ipcMain.handle("verify-license", async (event, licenseKey) => {
    try {
      const result = await verifyLicense(licenseKey);

      // If result is a boolean (backward compatibility)
      if (typeof result === "boolean") {
        if (result) {
          // Store the valid license key
          const { default: Store } = await import("electron-store");
          const store = new Store();
          store.set("licenseKey", licenseKey);
          setLicenseValid(true);
          // Close license window and open main app
          setImmediate(() => openMainAppWindow(createWindow));
        }
        return { success: result };
      }

      // If result is an object with success property
      if (result.success) {
        // Store the valid license key
        const { default: Store } = await import("electron-store");
        const store = new Store();
        store.set("licenseKey", licenseKey);
        setLicenseValid(true);
        // Close license window and open main app
        setImmediate(() => openMainAppWindow(createWindow));
      }
      // Handle license errors
      else if (result.error) {
        // Check if it's a deactivated or refunded license
        if (
          result.error.includes("deactivated") ||
          result.error.includes("refunded")
        ) {
          // Clear the invalid license
          const { default: Store } = await import("electron-store");
          const store = new Store();
          store.delete("licenseKey");
          setLicenseValid(false);
        }
      }

      return result;
    } catch (error) {
      Logger.error("Error in verify-license handler:", error);
      return { success: false, error: error.message };
    }
  });

  // Clear license
  ipcMain.handle("clear-license", async () => {
    try {
      const { default: Store } = await import("electron-store");
      const store = new Store();
      store.delete("licenseKey");
      setLicenseValid(false);
      return { success: true };
    } catch (error) {
      Logger.error("Error clearing license:", error);
      return { success: false, error: error.message };
    }
  });

  // Restart app
  ipcMain.handle("restart-app", async () => {
    try {
      // Close all windows
      BrowserWindow.getAllWindows().forEach((window) => {
        window.close();
      });

      // Reset license manager state
      setLicenseValid(false);

      // Reset window manager state
      resetWindowManagerState();
      resetRefreshState();

      // Re-launch the app flow
      const { onAppLaunch } = require("../lib/licenseManager");
      setImmediate(() => {
        onAppLaunch(createWindow);
      });

      return { success: true };
    } catch (error) {
      Logger.error("Error restarting app:", error);
      return { success: false, error: error.message };
    }
  });

  // Get app info
  ipcMain.handle("get-app-info", () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      isDev,
    };
  });

  // Get backend info
  ipcMain.handle("get-backend-info", () => {
    const { getBackendPort } = require("../backend/backendManager");
    const backendPort = getBackendPort();
    return {
      backendPort,
      url: `http://localhost:${backendPort}`,
      status: backendPort ? "running" : "not-started",
    };
  });

  // API call handler
  ipcMain.handle("api-call", async (event, endpoint, options = {}) => {
    try {
      const { getBackendPort } = require("../backend/backendManager");
      const backendPort = getBackendPort();
      if (!backendPort) {
        throw new Error("Backend not ready");
      }

      const url = `http://localhost:${backendPort}${endpoint}`;

      const fetchOptions = {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      };

      if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(
          `API call failed: ${response.status} ${response.statusText}`
        );
      }

      return { success: true, data };
    } catch (error) {
      Logger.error(`API call error for ${endpoint}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Show item in folder
  ipcMain.handle("show-item-in-folder", async (event, filePath) => {
    try {
      shell.showItemInFolder(filePath);
      return { success: true };
    } catch (error) {
      Logger.error("Error showing item in folder:", error);
      return { success: false, error: error.message };
    }
  });

  // Get settings
  ipcMain.handle("get-settings", async () => {
    try {
      const result = await settingsManager.getSettings();
      return result;
    } catch (error) {
      Logger.error("Error getting settings:", error);
      return { success: false, error: error.message };
    }
  });

  // Update a single setting
  ipcMain.handle("update-setting", async (event, key, value) => {
    try {
      const result = await settingsManager.updateSetting(key, value);
      return result;
    } catch (error) {
      Logger.error("Error updating setting:", error);
      return { success: false, error: error.message };
    }
  });

  // Update settings
  ipcMain.handle("update-settings", async (event, newSettings) => {
    try {
      const result = await settingsManager.updateSettings(newSettings);
      return result;
    } catch (error) {
      Logger.error("Error updating settings:", error);
      return { success: false, error: error.message };
    }
  });

  // Select download folder
  ipcMain.handle("select-download-folder", async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
      });

      if (result.canceled) {
        return { success: false, error: "User canceled folder selection" };
      }

      return { success: true, path: result.filePaths[0] };
    } catch (error) {
      Logger.error("Error selecting download folder:", error);
      return { success: false, error: error.message };
    }
  });

  // Ping
  ipcMain.handle("ping", async () => {
    return "pong";
  });
}

module.exports = { setupIpcHandlers };
