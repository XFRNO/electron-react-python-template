import { ipcMain, shell, dialog, BrowserWindow, app } from "electron";
import { Logger } from "../utils/logger";
import { resetWindowManagerState } from "../windows/windowManager";
import { setLicenseValid } from "../lib/licenseManager";

/**
 * Sets up system-related IPC handlers
 * @param isDev - Development mode flag
 * @param createWindow - Function to create main window
 */
export function setupSystemHandlers(
  isDev: boolean,
  createWindow: () => void
): void {
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

      // Re-launch the app flow
      const { onAppLaunch } = await import("../lib/licenseManager.js");
      setImmediate(() => {
        onAppLaunch(createWindow);
      });

      return { success: true };
    } catch (error) {
      Logger.error("Error restarting app:", error);
      return { success: false, error: (error as Error).message };
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
  ipcMain.handle("show-item-in-folder", async (event, filePath: string) => {
    try {
      shell.showItemInFolder(filePath);
      return { success: true };
    } catch (error) {
      Logger.error("Error showing item in folder:", error);
      return { success: false, error: (error as Error).message };
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
      return { success: false, error: (error as Error).message };
    }
  });
}
