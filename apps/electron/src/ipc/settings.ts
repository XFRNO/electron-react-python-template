import { ipcMain } from "electron";
import { Logger } from "../utils/logger.js";
import { settingsManager, Settings } from "../utils/settingsManager.js"; // Import Settings interface

/**
 * Sets up settings-related IPC handlers
 */
export function setupSettingsHandlers(): void {
  // Get settings
  ipcMain.handle("get-settings", async () => {
    try {
      const result = await settingsManager.getSettings();
      return result;
    } catch (error) {
      Logger.error("Error getting settings:", error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Update a single setting
  ipcMain.handle(
    "update-setting",
    async (event, key: keyof Settings, value: any) => {
      try {
        const result = await settingsManager.updateSetting(
          key as keyof Settings,
          value
        );
        return result;
      } catch (error) {
        Logger.error("Error updating setting:", error);
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // Update settings
  ipcMain.handle("update-settings", async (event, newSettings: any) => {
    try {
      const result = await settingsManager.updateSettings(newSettings);
      return result;
    } catch (error) {
      Logger.error("Error updating settings:", error);
      return { success: false, error: (error as Error).message };
    }
  });
}
