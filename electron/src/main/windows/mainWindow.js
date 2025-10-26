const { BrowserWindow, app } = require("electron");
const path = require("path");
const { Logger } = require("../utils/logger");

let mainWindow = null;
let isRefreshing = false;
let contentLoadTimeout = null;
let isDev = !app.isPackaged;

/**
 * Creates the main application window
 * @param {Function} onContentLoaded - Callback when content is loaded
 * @returns {Promise<BrowserWindow>} The main window instance
 */
async function createMainWindow(onContentLoaded) {
  const ROOT = path.join(__dirname, "../../../");

  // Define window options with icon for development
  const windowOptions = {
    title: "Video Downloader",
    width: 800,
    height: 1000,
    show: false, // Keep hidden until both backend and content are ready
    backgroundColor: "#1a1a1a", // Dark background to prevent white flash
    webPreferences: {
      contextIsolation: true,
      preload: path.join(ROOT, "src/preload.js"),
      webSecurity: true,
      nodeIntegration: false,
      // Optimize for performance
      sandbox: false,
      spellcheck: false,
    },
  };

  // Add platform-specific icon for development mode
  if (isDev) {
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

  mainWindow = new BrowserWindow(windowOptions);

  setupMainWindowEvents(onContentLoaded);

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (contentLoadTimeout) {
      clearTimeout(contentLoadTimeout);
      contentLoadTimeout = null;
    }
  });

  // Add error handling for debugging
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      Logger.error(
        `Main window failed to load: ${errorCode} - ${errorDescription}`
      );
    }
  );

  mainWindow.webContents.on("render-process-gone", (event, details) => {
    Logger.error(`Main window render process gone: ${JSON.stringify(details)}`);
  });

  return mainWindow;
}

/**
 * Sets up main window event handlers
 * @param {Function} onContentLoaded - Callback when content is loaded
 */
function setupMainWindowEvents(onContentLoaded) {
  // Handle navigation/refresh events
  mainWindow.webContents.on("will-navigate", (event, url) => {
    // Check if this is a refresh/reload (same URL) or actual navigation
    const currentURL = mainWindow.webContents.getURL();
    if (currentURL && url === currentURL) {
      Logger.log("Refresh/reload detected, setting refresh flag");
      isRefreshing = true;
    }
  });

  // For production file:// URLs, we can show the window more quickly
  if (!isDev) {
    // In production, we can show the window as soon as it's created
    // since file:// URLs load very quickly
    Logger.log("Production mode: Setting immediate show timeout");
    contentLoadTimeout = setTimeout(() => {
      if (!isRefreshing && mainWindow && !mainWindow.isDestroyed()) {
        Logger.log("Production mode: Showing window immediately");
        if (onContentLoaded) {
          onContentLoaded();
        }
      }
    }, 100); // Very short timeout for production
  }

  // Handle content loading completion - single event handler
  mainWindow.webContents.on("did-finish-load", () => {
    Logger.log("Main window content finished loading");

    // Clear the timeout since content loaded successfully
    if (contentLoadTimeout) {
      clearTimeout(contentLoadTimeout);
      contentLoadTimeout = null;
    }

    if (isRefreshing) {
      Logger.log("Refresh completed, showing main window immediately");
      isRefreshing = false;
      // Show main window immediately on refresh (no splash needed)
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      // This is initial load, check if both conditions are met
      Logger.log("Initial load completed, checking conditions for main window");
      if (onContentLoaded) {
        onContentLoaded();
      }
    }
  });

  // Add a fallback timeout to show the window even if content loading is slow
  if (isDev) {
    contentLoadTimeout = setTimeout(() => {
      if (!isRefreshing && mainWindow && !mainWindow.isDestroyed()) {
        Logger.warn(
          "Content loading timeout (dev mode) - showing window anyway"
        );
        if (onContentLoaded) {
          onContentLoaded();
        }
      }
    }, 5000); // 5 second timeout for development
  }
}

/**
 * Loads content into the main window
 * @param {string} urlOrPath - The URL to load (dev) or file path (prod)
 */
function loadMainWindowContent(urlOrPath) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (isDev) {
      Logger.log(`Loading frontend from dev server: ${urlOrPath}`);
      mainWindow.loadURL(urlOrPath);
      Logger.log(`✅ Frontend loaded from dev server: ${urlOrPath}`);
    } else {
      // In production, urlOrPath is actually a file path
      Logger.log(`Loading production frontend from: ${urlOrPath}`);
      mainWindow.loadFile(urlOrPath);
      Logger.log("✅ Frontend loaded instantly from local file");
    }
  }
}

/**
 * Shows the main window and focuses it
 */
function showMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    Logger.log("Main window shown and focused");
  }
}

/**
 * Gets the current main window instance
 * @returns {BrowserWindow|null}
 */
function getMainWindow() {
  return mainWindow;
}

/**
 * Checks if main window is ready (exists and not destroyed)
 * @returns {boolean}
 */
function isMainWindowReady() {
  return mainWindow && !mainWindow.isDestroyed() && !isRefreshing;
}

/**
 * Resets the refresh state
 */
function resetRefreshState() {
  isRefreshing = false;
}

module.exports = {
  createMainWindow,
  loadMainWindowContent,
  showMainWindow,
  getMainWindow,
  isMainWindowReady,
  resetRefreshState,
};
