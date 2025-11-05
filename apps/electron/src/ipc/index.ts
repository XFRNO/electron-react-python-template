import { ipcMain } from "electron";
import { setupLicenseHandlers } from "./license";
import { setupApiHandlers } from "./api";
import { setupSystemHandlers } from "./system";
import { setupSettingsHandlers } from "./settings";

/**
 * Sets up all IPC handlers for the application
 * @param createWindow - Function to create main window
 * @param isDev - Development mode flag
 */
export function setupIpcHandlers(
  createWindow: () => void,
  isDev: boolean
): void {
  // Setup license handlers
  setupLicenseHandlers(async () => {
    createWindow();
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
