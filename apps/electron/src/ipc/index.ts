import { BrowserWindow, ipcMain } from "electron";
import { setupLicenseHandlers } from "./license.js";
import { setupApiHandlers } from "./api.js";
import { setupSystemHandlers } from "./system.js";
import { setupSettingsHandlers } from "./settings.js";

/**
 * Sets up all IPC handlers for the application
 * @param createWindow - Function to create main window
 * @param isDev - Development mode flag
 */
export function setupIpcHandlers(
  createWindow: () => Promise<BrowserWindow>,
  isDev: boolean
): void {
  // Setup license handlers
  setupLicenseHandlers(async () => {
    await createWindow();
  });

  // Setup API handlers
  setupApiHandlers();

  // Setup system handlers
  setupSystemHandlers(isDev, createWindow);

  // Setup settings handlers
  setupSettingsHandlers();

  // Ping handler
  ipcMain.handle("ping", async () => {
    return "pong";
  });
}

export {
  setupLicenseHandlers,
  setupApiHandlers,
  setupSystemHandlers,
  setupSettingsHandlers,
};
