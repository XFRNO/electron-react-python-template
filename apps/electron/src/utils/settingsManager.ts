import { app } from "electron";
import path from "path";
import Store from "electron-store";
import { Logger } from "./logger";

interface Settings {
  default_output_path: string;
  default_format: string;
  default_quality: string;
}

class SettingsManager {
  private store: Store<Settings> | null = null;
  private initialized = false;

  private async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      this.store = new Store<Settings>({
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

      const settings = this.store!.store;
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

      const value = this.store!.get(key);
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

      this.store!.set(key, value);
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

      this.store!.set(settings);
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
