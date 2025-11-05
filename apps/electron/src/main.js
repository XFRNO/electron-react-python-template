const { app, globalShortcut, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { Logger } = require("./utils/logger");
const {
  createSplashWindow,
  showSplashError,
} = require("./windows/splashWindow");
const {
  createMainWindow,
  loadMainWindowContent,
} = require("./windows/mainWindow");
const { checkAndShowMainWindow } = require("./windows/windowManager");
const { frontendManager } = require("./lib/frontendManager");
const { backendManager } = require("./lib/backendManager");
const { licenseManager } = require("./lib/licenseManager");
import { setupIpcHandlers } from "./ipc/index.ts";
const { getPort } = require("./utils/getPort");
const { default: setupGlobalShortcuts } = require("./lib/setupGlobalShortcuts");

// Constants
const isDev = !app.isPackaged;
const ROOT = path.join(__dirname, "../../");

// Splash screen flag - set to false to disable splash screen
const SHOW_SPLASH_SCREEN = false;

// Global state
let store = null;
let appStartTime = null;
let backendPort = null;

/**
 * Creates the main application window
 * @returns {Promise<BrowserWindow>} The main window instance
 */
async function createWindow() {
  Logger.log("Creating main window");

  // Create main window with content loaded callback
  const mainWindow = await createMainWindow(() => {
    // Don't close license window as it might be intentionally shown for license verification
    checkAndShowMainWindow(false);
  });

  try {
    if (isDev) {
      // Development mode:
      // Turborepo orchestrates the Vite dev server and FastAPI backend.
      // Electron should NOT spawn any servers. It only waits for the dev frontend URL.
      const frontendUrl = await frontendManager.launch(isDev, ROOT);
      loadMainWindowContent(frontendUrl);
      // No backend launch in dev mode.
    } else {
      // Production mode:
      // Load built frontend and start the packaged backend executable.
      const frontendPath = await frontendManager.launch(isDev, ROOT);
      const frontendPort = frontendManager.getPort();
      loadMainWindowContent(frontendPath);

      // Get a dynamic port for the backend
      backendPort = await getPort();
      Logger.log(`Allocated backend port: ${backendPort}`);
      if (store) {
        store.set("backendPort", backendPort);
      }

      // Start backend in parallel (production only)
      backendManager.start(isDev, ROOT, backendPort, null, frontendPort).catch((err) => {
        Logger.error("Backend startup failed:", err);
      });
    }
  } catch (error) {
    Logger.error("Error setting up application:", error);
    await showSplashError(`Application setup failed: ${error.message}`);
  }

  return mainWindow;
}

/**
 * Main application initialization
 */
app.whenReady().then(async () => {
  appStartTime = Date.now();
  Logger.log("App starting up");

  try {
    // Setup global shortcuts
    setupGlobalShortcuts();

    // Create and show splash window immediately (if enabled)
    if (SHOW_SPLASH_SCREEN) {
      Logger.log("Creating splash window");
      await createSplashWindow();
    }

    // Initialize electron-store
    const { default: Store } = await import("electron-store");
    store = new Store();

    // Initialize LicenseManager
    licenseManager.init(store, isDev, ROOT);

    // Setup IPC handlers
    setupIpcHandlers(createWindow, isDev);

    // Start the app launch sequence
    Logger.log("Starting app launch sequence");
    await licenseManager.onAppLaunch(createWindow);

    const elapsed = Date.now() - appStartTime;
    Logger.log(`App launch sequence completed (took ${elapsed}ms)`);
  } catch (error) {
    Logger.error("Startup error:", error);

    // Show error in splash window instead of dialog (if splash is enabled)
    if (SHOW_SPLASH_SCREEN) {
      try {
        await showSplashError(`Startup error: ${error.message}`);
      } catch (splashError) {
        // Fallback to dialog if splash error fails
        dialog.showErrorBox("Startup error", String(error));
        app.quit();
      }
    } else {
      // Directly show error dialog if splash is disabled
      dialog.showErrorBox("Startup error", String(error));
      app.quit();
    }
  }
});

// Handle second instance
app.on("second-instance", () => {
  const mainWindow = require("./windows/mainWindow").getMainWindow();
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Handle all windows closed
app.on("window-all-closed", () => {
  const elapsed = Date.now() - appStartTime;
  Logger.log(`App closing (ran for ${elapsed}ms)`);
  backendManager.stop();
  frontendManager.kill();
  app.quit();
});

// Handle before quit
app.on("before-quit", () => {
  backendManager.stop();
  frontendManager.kill();

  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// Handle process exit
process.on("exit", () => {
  backendManager.stop();
  frontendManager.kill();
});

// Handle app activation (macOS)
app.on("activate", () => licenseManager.handleAppActivation());

Logger.log("Main process initialized");