const { ipcMain, shell, dialog, BrowserWindow, app } = require("electron");
const { Logger } = require("../utils/logger");
const {
  resetWindowManagerState,
  resetRefreshState,
} = require("../windows/windowManager");
const fs = require("fs");
const path = require("path");
const { settingsManager } = require("../utils/settingsManager");
const { storageManager } = require("../utils/storageManager");

// Import license manager functions
const {
  verifyLicense,
  clearLicense,
  setLicenseValid,
  showLicenseWindow,
  openMainAppWindow,
  verifyStoredLicense,
} = require("../../lib/licenseManager");

/**
 * Sets up all IPC handlers for the application
 * @param {Object} licenseManager - License manager instance (for backward compatibility)
 * @param {Function} createWindow - Function to create main window
 * @param {boolean} isDev - Development mode flag
 */
function setupIpcHandlers(licenseManager, createWindow, isDev) {
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
      const { onAppLaunch } = require("../../lib/licenseManager");
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

  // Synchronous backend info for WebSocket creation
  ipcMain.on("get-backend-info-sync", (event) => {
    const { getBackendPort } = require("../backend/backendManager");
    const backendPort = getBackendPort();
    event.returnValue = {
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

  // Download file
  ipcMain.handle("download-file", async (event, downloadData) => {
    try {
      const { url, filename, folder } = downloadData;

      // Validate inputs
      if (!url || !filename) {
        throw new Error("Missing required parameters: url and filename");
      }

      // Create downloads directory if it doesn't exist
      const downloadsDir = path.join(
        app.getPath("downloads"),
        "VideoDownloader"
      );
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      // Determine full file path
      let fullPath = path.join(downloadsDir, filename);

      // Handle folder if specified
      if (folder) {
        const folderPath = path.join(downloadsDir, folder);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        fullPath = path.join(folderPath, filename);
      }

      // Check if file already exists
      if (fs.existsSync(fullPath)) {
        throw new Error("File already exists");
      }

      // Download the file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`
        );
      }

      // Create write stream and pipe response body
      const fileStream = fs.createWriteStream(fullPath);
      await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on("error", reject);
        fileStream.on("finish", resolve);
        fileStream.on("error", reject);
      });

      Logger.log(`File downloaded successfully: ${fullPath}`);
      return { success: true, path: fullPath };
    } catch (error) {
      Logger.error("Error downloading file:", error);
      return { success: false, error: error.message };
    }
  });

  // Open file
  ipcMain.handle("open-file", async (event, filePath) => {
    try {
      await shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      Logger.error("Error opening file:", error);
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

  // Get download history
  ipcMain.handle("get-download-history", async () => {
    try {
      return await storageManager.getDownloadHistory();
    } catch (error) {
      Logger.error("Error getting download history:", error);
      return { success: false, error: error.message };
    }
  });

  // Add to download history
  ipcMain.handle("add-to-download-history", async (event, downloadInfo) => {
    try {
      await storageManager.addToDownloadHistory(downloadInfo);
      return { success: true };
    } catch (error) {
      Logger.error("Error adding to download history:", error);
      return { success: false, error: error.message };
    }
  });

  // Clear download history
  ipcMain.handle("clear-download-history", async () => {
    try {
      await storageManager.clearDownloadHistory();
      return { success: true };
    } catch (error) {
      Logger.error("Error clearing download history:", error);
      return { success: false, error: error.message };
    }
  });

  // Save pasted cookies
  ipcMain.handle("save-pasted-cookies", async (event, cookiesContent) => {
    try {
      const cookiesPath = storageManager.getCookiesPath();
      fs.writeFileSync(cookiesPath, cookiesContent, "utf8");
      Logger.log(`Cookies saved to: ${cookiesPath}`);
      return { success: true, filePath: cookiesPath };
    } catch (error) {
      Logger.error("Error saving cookies:", error);
      return { success: false, error: error.message };
    }
  });

  // Clear cookies
  ipcMain.handle("clear-cookies", async () => {
    try {
      const cookiesPath = storageManager.getCookiesPath();
      if (fs.existsSync(cookiesPath)) {
        fs.unlinkSync(cookiesPath);
        Logger.log(`Cookies file deleted: ${cookiesPath}`);
      }
      return { success: true };
    } catch (error) {
      Logger.error("Error clearing cookies:", error);
      return { success: false, error: error.message };
    }
  });

  // Check if cookies file exists
  ipcMain.handle("check-cookies-exists", async () => {
    try {
      const cookiesPath = storageManager.getCookiesPath();
      const exists = fs.existsSync(cookiesPath);
      return { success: true, exists };
    } catch (error) {
      Logger.error("Error checking cookies existence:", error);
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

  // Open external URL
  ipcMain.handle("open-external-url", async (event, url) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      Logger.error("Error opening external URL:", error);
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

  // Get app logs
  ipcMain.handle("get-app-logs", async () => {
    try {
      const logPath = Logger.getLogPath();
      if (fs.existsSync(logPath)) {
        const logs = fs.readFileSync(logPath, "utf8");
        return { success: true, logs };
      } else {
        return { success: true, logs: "No logs found" };
      }
    } catch (error) {
      Logger.error("Error getting app logs:", error);
      return { success: false, error: error.message };
    }
  });

  // Clear app logs
  ipcMain.handle("clear-app-logs", async () => {
    try {
      Logger.clearLogs();
      return { success: true };
    } catch (error) {
      Logger.error("Error clearing app logs:", error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { setupIpcHandlers };
