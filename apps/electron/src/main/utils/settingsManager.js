const { app } = require("electron");
const path = require("path");
const { Logger } = require("./logger");

class SettingsManager {
  constructor() {
    this.store = null;
    this.initialized = false;
    // We'll initialize the store when needed
  }

  async initialize() {
    if (this.initialized) return true;

    try {
      // Dynamically import electron-store
      const StoreModule = await import("electron-store");
      const Store = StoreModule.default;

      // Create store instance with default values
      // Removed cookies_browser and cookies_file since Python handles those
      this.store = new Store({
        name: "settings",
        defaults: {
          default_output_path: path.join(app.getPath("home"), "Downloads"),
          default_format: "mp4",
          default_quality: "best",
        },
      });

      this.initialized = true;
      Logger.log("SettingsManager initialized successfully");
      return true;
    } catch (error) {
      Logger.error("Failed to initialize SettingsManager:", error);
      return false;
    }
  }

  /**
   * Get all settings
   * @returns {Object} Settings object
   */
  async getSettings() {
    try {
      if (!this.initialized) {
        const success = await this.initialize();
        if (!success) {
          // Return default values in the expected format
          return {
            success: true,
            data: {
              default_output_path: path.join(app.getPath("home"), "Downloads"),
              default_format: "mp4",
              default_quality: "best",
            },
          };
        }
      }

      // Get settings and remove cookies_browser and cookies_file if they exist
      const settings = this.store.store;
      const cleanSettings = { ...settings };
      delete cleanSettings.cookies_browser;
      delete cleanSettings.cookies_file;

      return {
        success: true,
        data: cleanSettings,
      };
    } catch (error) {
      Logger.error("Error getting settings:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get a specific setting
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  async getSetting(key) {
    try {
      // Return null for cookies_browser and cookies_file since Python handles those
      if (key === "cookies_browser" || key === "cookies_file") {
        return {
          success: true,
          data: null,
        };
      }

      if (!this.initialized) {
        const success = await this.initialize();
        if (!success) {
          return {
            success: false,
            error: "Failed to initialize settings manager",
          };
        }
      }

      const value = this.store.get(key);
      return {
        success: true,
        data: value,
      };
    } catch (error) {
      Logger.error(`Error getting setting ${key}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update a specific setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @returns {boolean} Success status
   */
  async updateSetting(key, value) {
    try {
      // Ignore updates to cookies_browser and cookies_file since Python handles those
      if (key === "cookies_browser" || key === "cookies_file") {
        return {
          success: true,
        };
      }

      if (!this.initialized) {
        const success = await this.initialize();
        if (!success) {
          return {
            success: false,
            error: "Failed to initialize settings manager",
          };
        }
      }

      this.store.set(key, value);
      Logger.log(`Setting updated: ${key} = ${value}`);
      return {
        success: true,
      };
    } catch (error) {
      Logger.error(`Failed to update setting ${key}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update multiple settings
   * @param {Object} settings - Settings object with key-value pairs
   * @returns {boolean} Success status
   */
  async updateSettings(settings) {
    try {
      // Remove cookies_browser and cookies_file from settings since Python handles those
      const cleanSettings = { ...settings };
      delete cleanSettings.cookies_browser;
      delete cleanSettings.cookies_file;

      if (!this.initialized) {
        const success = await this.initialize();
        if (!success) {
          return {
            success: false,
            error: "Failed to initialize settings manager",
          };
        }
      }

      this.store.set(cleanSettings);
      Logger.log("Multiple settings updated:", cleanSettings);
      return {
        success: true,
      };
    } catch (error) {
      Logger.error("Failed to update multiple settings:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Create a singleton instance
const settingsManager = new SettingsManager();

module.exports = {
  settingsManager,
};
