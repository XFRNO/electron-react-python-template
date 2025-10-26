const { BrowserWindow, app } = require("electron");
const path = require("path");
const { Logger } = require("../utils/logger");

let splashWindow = null;

/**
 * Creates and shows the splash window
 * @returns {Promise<BrowserWindow>} The splash window instance
 */
async function createSplashWindow() {
  const ROOT = path.join(__dirname, "../../../");

  // Define window options with icon for development
  const windowOptions = {
    width: 400,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    show: false,
    center: true,
    resizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  };

  // Add platform-specific icon for development mode
  if (!app.isPackaged) {
    const platform = process.platform;
    let iconPath;

    if (platform === "darwin") {
      // macOS
      iconPath = path.join(ROOT, "assets/icon.icns");
    } else if (platform === "win32") {
      // Windows
      iconPath = path.join(ROOT, "assets/icon.ico");
    } else {
      // Linux and others
      iconPath = path.join(ROOT, "assets/icon.png");
    }

    windowOptions.icon = iconPath;
  }

  splashWindow = new BrowserWindow(windowOptions);

  splashWindow.loadFile(path.join(ROOT, "src/windows/splash.html"));

  splashWindow.once("ready-to-show", () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.show();
      Logger.log("Splash window shown");
    }
  });

  splashWindow.on("closed", () => {
    splashWindow = null;
  });

  return splashWindow;
}

/**
 * Shows an error message in the splash window
 * @param {string} errorMessage - The error message to display
 */
async function showSplashError(errorMessage) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    await splashWindow.webContents.executeJavaScript(`
      window.splashApi.showError("${errorMessage
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")}");
    `);
  }
}

/**
 * Closes the splash window immediately
 */
function closeSplashWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
    Logger.log("Splash window closed immediately");
  }
}

/**
 * Gets the current splash window instance
 * @returns {BrowserWindow|null}
 */
function getSplashWindow() {
  return splashWindow;
}

module.exports = {
  createSplashWindow,
  showSplashError,
  closeSplashWindow,
  getSplashWindow,
};
