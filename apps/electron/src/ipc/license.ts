import { ipcMain } from "electron";
import { Logger } from "../utils/logger";
import {
  verifyLicense,
  setLicenseValid,
  openMainAppWindow,
} from "../lib/licenseManager.js";
import Store from "electron-store";

/**
 * Sets up license-related IPC handlers
 * @param createWindow - Function to create main window
 */
export function setupLicenseHandlers(createWindow: () => void): void {
  // License verification
  ipcMain.handle(
    "verify-license",
    async (event, licenseKey: string) => {
      try {
        const result = await verifyLicense(licenseKey);

        // If result is a boolean (backward compatibility)
        if (typeof result === "boolean") {
          if (result) {
            // Store the valid license key
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
            const store = new Store();
            store.delete("licenseKey");
            setLicenseValid(false);
          }
        }

        return result;
      } catch (error) {
        Logger.error("Error in verify-license handler:", error);
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // Clear license
  ipcMain.handle("clear-license", async () => {
    try {
      const store = new Store();
      store.delete("licenseKey");
      setLicenseValid(false);
      return { success: true };
    } catch (error) {
      Logger.error("Error clearing license:", error);
      return { success: false, error: (error as Error).message };
    }
  });
}
