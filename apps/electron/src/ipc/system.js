const { ipcMain, shell, dialog, BrowserWindow, app } = require("electron");
const { Logger } = require("../utils/logger");
const {
  resetWindowManagerState,
  resetRefreshState,
} = require("../windows/windowManager");
const { setLicenseValid } = require("../lib/licenseManager");

/**
 * Sets up system-related IPC handlers
 * @param {boolean} isDev - Development mode flag
 * @param {Function} createWindow - Function to create main window
 */
function setupSystemHandlers(isDev, createWindow) {
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

  // Select output folder
  ipcMain.handle("select-output-folder", async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
      });

      if (result.canceled) {
        return { success: false, error: "User canceled folder selection" };
      }

      return { success: true, path: result.filePaths[0] };
    } catch (error) {
      Logger.error("Error selecting output folder:", error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { setupSystemHandlers };
