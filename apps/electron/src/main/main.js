const { app, globalShortcut, BrowserWindow, dialog } = require("electron");
const path = require("path");

// Import modules
const { Logger } = require("./utils/logger");
const {
  createSplashWindow,
  showSplashError,
} = require("./windows/splashWindow");
const {
  createMainWindow,
  loadMainWindowContent,
} = require("./windows/mainWindow");
const {
  checkAndShowMainWindow,
  resetWindowManagerState,
} = require("./windows/windowManager");
const {
  launchFrontend,
  killFrontendProcess,
  getFrontendPort,
} = require("./frontend/frontendManager");
const {
  launchBackend,
  killAllProcesses,
  getBackendPort,
} = require("./backend/backendManager");
const { setupIpcHandlers } = require("./ipc/ipcHandlers");

// Import license manager functions
const {
  initLicenseManager,
  onAppLaunch,
  verifyStoredLicense,
  setLicenseValid,
  showLicenseWindow,
  getIsLicenseValid,
} = require("../lib/licenseManager");

// Constants
const isDev = !app.isPackaged;
const ROOT = path.join(__dirname, "../../");

// Splash screen flag - set to false to disable splash screen
const SHOW_SPLASH_SCREEN = false;

// Global state
let store = null;
let licenseManager = null;
let appStartTime = null;

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
      const frontendUrl = await launchFrontend(isDev, ROOT);
      console.log("XXXXXXXXXXXXX", frontendUrl);
      loadMainWindowContent(frontendUrl);
      // loadMainWindowContent("http://localhost:5173");
      // No backend launch in dev mode.
    } else {
      // Production mode:
      // Load built frontend and start the packaged backend executable.
      const frontendPath = await launchFrontend(isDev, ROOT);
      loadMainWindowContent(frontendPath);

      // Start backend in parallel (production only)
      launchBackend(isDev, ROOT).catch((err) => {
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
 * Sets up global shortcuts
 */
function setupGlobalShortcuts() {
  // Disable reload and dev tools shortcuts
  //   globalShortcut.register("CommandOrControl+R", () => {
  // Prevent reload
  //   });

  globalShortcut.register("CommandOrControl+Shift+R", () => {
    // Prevent hard reload
  });

  globalShortcut.register("F5", () => {
    // Prevent refresh
  });

  globalShortcut.register("CommandOrControl+Shift+I", () => {
    // Prevent DevTools
  });

  Logger.log("Global shortcuts registered");
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
    initLicenseManager(store, isDev, ROOT);
    // Store reference for later use
    licenseManager = { onAppLaunch };

    // Setup IPC handlers
    setupIpcHandlers(licenseManager, createWindow, isDev);

    // Start the app launch sequence
    Logger.log("Starting app launch sequence");
    await onAppLaunch(createWindow);

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
  killAllProcesses();
  app.quit();
});

// Handle before quit
app.on("before-quit", () => {
  killAllProcesses();
  globalShortcut.unregisterAll();
});

// Handle process exit
process.on("exit", () => {
  killAllProcesses();
});

// Handle app activation (macOS)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (getIsLicenseValid()) {
      // Reset state and recreate windows
      resetWindowManagerState();
      if (SHOW_SPLASH_SCREEN) {
        createSplashWindow().then(() => {
          createWindow();
        });
      } else {
        createWindow();
      }
    } else if (licenseManager) {
      // Check if there's a stored license that might need re-verification
      const getStoredLicense = async () => {
        try {
          const { default: Store } = await import("electron-store");
          const tempStore = new Store();
          return tempStore.get("licenseKey");
        } catch (error) {
          Logger.error("Error getting stored license:", error);
          return null;
        }
      };

      getStoredLicense().then((storedLicense) => {
        if (storedLicense) {
          // Try to verify the stored license again
          verifyStoredLicense(storedLicense)
            .then((isValid) => {
              if (isValid) {
                setLicenseValid(true);
                // Reset state and recreate windows
                resetWindowManagerState();
                if (SHOW_SPLASH_SCREEN) {
                  createSplashWindow().then(() => {
                    createWindow();
                  });
                } else {
                  createWindow();
                }
              } else {
                showLicenseWindow();
              }
            })
            .catch(() => {
              showLicenseWindow();
            });
        } else {
          showLicenseWindow();
        }
      });
    }
  }
});

Logger.log("Main process initialized");
