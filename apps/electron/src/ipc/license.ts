import { ipcMain } from "electron";
import { Logger } from "../utils/logger";
import { licenseManager } from "../lib/licenseManager";
import Store from "electron-store";

/**
 * Sets up license-related IPC handlers
 * @param createWindow - Function to create main window
 */
export function setupLicenseHandlers(createWindow: () => Promise<any>): void {
  // License verification
  ipcMain.handle("verify-license", async (event, licenseKey: string) => {
    try {
      const result = await licenseManager.verifyLicense(licenseKey);

      if (result.success) {
        // Close license window and open main app
        setImmediate(() => licenseManager.onAppLaunch(createWindow));
      } else if (result.error) {
        // Check if it's a deactivated or refunded license
        if (
          result.error.includes("deactivated") ||
          result.error.includes("refunded")
        ) {
          // Clear the invalid license
          await licenseManager.clearLicense();
          storeManager.delete("licenseKey"); // Also delete from storeManager
        }
      }

      return result;
    } catch (error) {
      Logger.error("Error in verify-license handler:", error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Clear license
  ipcMain.handle("clear-license", async () => {
    try {
      await licenseManager.clearLicense();
      return { success: true };
    } catch (error) {
      Logger.error("Error clearing license:", error);
      return { success: false, error: (error as Error).message };
    }
  });
}
