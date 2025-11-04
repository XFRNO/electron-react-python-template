const { ipcMain } = require("electron");
const { setupLicenseHandlers } = require("./license");
const { setupApiHandlers } = require("./api");
const { setupSystemHandlers } = require("./system");
const { setupSettingsHandlers } = require("./settings");

/**
 * Sets up all IPC handlers for the application
 * @param {Function} createWindow - Function to create main window
 * @param {boolean} isDev - Development mode flag
 */
function setupIpcHandlers(createWindow, isDev) {
  // Setup license handlers
  setupLicenseHandlers(createWindow);

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

module.exports = {
  setupIpcHandlers,
  setupLicenseHandlers,
  setupApiHandlers,
  setupSystemHandlers,
  setupSettingsHandlers,
};
