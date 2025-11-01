const { BrowserWindow, app, dialog } = require("electron");
const path = require("path");
const { Logger } = require("../utils/logger");

let licenseWindow = null;

/**
 * Creates the license window
 * @param {string} rootPath - The root path of the application
 * @param {boolean} isDev - Whether the app is running in development mode
 * @returns {Promise<BrowserWindow>} The license window instance
 */
async function createLicenseWindow(rootPath, isDev) {
  Logger.log("Creating license window");
  Logger.log(`Root path: ${rootPath}`);
  Logger.log(`Development mode: ${isDev}`);

  // Always create a new window, don't reuse existing ones
  if (licenseWindow) {
    Logger.log("License window already exists, closing existing window");
    licenseWindow.close();
    licenseWindow = null;
  }

  const preloadPath = path.join(rootPath, "src/preload.js");

  // Define window options with icon for development
  const windowOptions = {
    width: 500,
    height: 500,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    show: true,
    backgroundColor: "#1a1a2e",
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
      nodeIntegration: false,
    },
  };

  // Add platform-specific icon for development mode
  if (isDev) {
    const platform = process.platform;
    let iconPath;

    if (platform === "darwin") {
      // macOS
      iconPath = path.join(rootPath, "assets/icon.icns");
    } else if (platform === "win32") {
      // Windows
      iconPath = path.join(rootPath, "assets/icon.ico");
    } else {
      // Linux and others
      iconPath = path.join(rootPath, "assets/icon.png");
    }

    windowOptions.icon = iconPath;
  }

  licenseWindow = new BrowserWindow(windowOptions);

  // Load the HTML content from external file
  // In packaged app, the file is in the Resources directory
  const licenseHtmlPath = isDev
    ? path.join(rootPath, "src/windows/license.html")
    : path.join(process.resourcesPath, "license.html");

  Logger.log(`Loading license HTML from: ${licenseHtmlPath}`);
  await licenseWindow.loadFile(licenseHtmlPath);
  Logger.log("License HTML loaded successfully");

  licenseWindow.once("ready-to-show", () => {
    Logger.log("License window ready to show event fired");
    if (licenseWindow && !licenseWindow.isDestroyed()) {
      Logger.log("Showing license window");
      licenseWindow.show();
      Logger.log("License window shown");
    } else {
      Logger.log("License window is null or destroyed, cannot show");
    }
  });

  licenseWindow.on("closed", () => {
    licenseWindow = null;
    Logger.log("License window closed and reference cleared");
  });

  // Add error handling
  licenseWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      Logger.error(
        `License window failed to load: ${errorCode} - ${errorDescription}`
      );
    }
  );

  licenseWindow.webContents.on("render-process-gone", (event, details) => {
    Logger.error(
      `License window render process gone: ${JSON.stringify(details)}`
    );
  });

  Logger.log("License window created successfully");
  return licenseWindow;
}

/**
 * Closes the license window
 */
function closeLicenseWindow() {
  Logger.log("Closing license window");
  if (licenseWindow && !licenseWindow.isDestroyed()) {
    licenseWindow.close();
    licenseWindow = null;
    Logger.log("License window closed immediately");
  } else {
    Logger.log("No license window to close or window already destroyed");
  }
}

/**
 * Gets the current license window instance
 * @returns {BrowserWindow|null}
 */
function getLicenseWindow() {
  return licenseWindow;
}

module.exports = {
  createLicenseWindow,
  closeLicenseWindow,
  getLicenseWindow,
};
