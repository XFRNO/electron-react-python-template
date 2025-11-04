const { ipcMain } = require("electron");
const { Logger } = require("../utils/logger");
const {
  verifyLicense,
  setLicenseValid,
  openMainAppWindow,
} = require("../lib/licenseManager");

/**
 * Sets up license-related IPC handlers
 * @param {Function} createWindow - Function to create main window
 */
function setupLicenseHandlers(createWindow) {
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
}

module.exports = { setupLicenseHandlers };
