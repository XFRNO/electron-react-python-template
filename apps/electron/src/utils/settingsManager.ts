import { app } from "electron";
import path from "path";
import { Logger } from "./logger";
import { storeManager } from "./storeManager"; // Import the new storeManager

interface Settings {
  default_output_path: string;
  default_format: string;
  default_quality: string;
}

class SettingsManager {
  private initialized = false;

  private async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Set default settings if they don't exist in storeManager
      if (storeManager.get("default_output_path") === undefined) {
        storeManager.set(
          "default_output_path",
          path.join(app.getPath("home"), "Downloads")
        );
      }
      if (storeManager.get("default_format") === undefined) {
        storeManager.set("default_format", "mp4");
      }
      if (storeManager.get("default_quality") === undefined) {
        storeManager.set("default_quality", "best");
      }

      this.initialized = true;
      Logger.log("SettingsManager initialized successfully");
      return true;
    } catch (error) {
      Logger.error("Failed to initialize SettingsManager:", error);
      return false;
    }
  }

  public async getSettings(): Promise<{
    success: boolean;
    data?: Settings;
    error?: string;
  }> {
    try {
      if (!this.initialized) {
        const success = await this.initialize();
        if (!success) {
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

      const settings: Settings = {
        default_output_path: storeManager.get("default_output_path") as string,
        default_format: storeManager.get("default_format") as string,
        default_quality: storeManager.get("default_quality") as string,
      };
      return {
        success: true,
        data: settings,
      };
    } catch (error) {
      Logger.error("Error getting settings:", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  public async getSetting(
    key: keyof Settings
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.initialized) {
        const success = await this.initialize();
        if (!success) {
          return {
            success: false,
            error: "Failed to initialize settings manager",
          };
        }
      }

      const value = storeManager.get(key);
      return {
        success: true,
        data: value,
      };
    } catch (error) {
      Logger.error(`Error getting setting ${key}:`, error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  public async updateSetting(
    key: keyof Settings,
    value: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.initialized) {
        const success = await this.initialize();
        if (!success) {
          return {
            success: false,
            error: "Failed to initialize settings manager",
          };
        }
      }

      storeManager.set(key, value);
      Logger.log(`Setting updated: ${key} = ${value}`);
      return {
        success: true,
      };
    } catch (error) {
      Logger.error(`Failed to update setting ${key}:`, error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  public async updateSettings(
    settings: Partial<Settings>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.initialized) {
        const success = await this.initialize();
        if (!success) {
          return {
            success: false,
            error: "Failed to initialize settings manager",
          };
        }
      }

      for (const key in settings) {
        if (Object.prototype.hasOwnProperty.call(settings, key)) {
          storeManager.set(key as keyof Settings, settings[key as keyof Settings]);
        }
      }
      Logger.log("Multiple settings updated:", settings);
      return {
        success: true,
      };
    } catch (error) {
      Logger.error("Failed to update multiple settings:", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}

export const settingsManager = new SettingsManager();
