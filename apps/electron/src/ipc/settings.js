const { ipcMain } = require("electron");
const { Logger } = require("../utils/logger");
const { settingsManager } = require("../utils/settingsManager");

/**
 * Sets up settings-related IPC handlers
 */
function setupSettingsHandlers() {
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
}

module.exports = { setupSettingsHandlers };
