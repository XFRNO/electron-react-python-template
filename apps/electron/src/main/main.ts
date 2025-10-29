/// <reference types="electrobun" />
import path from "path";
import { newWindow } from "electrobun";
import { Logger } from "./utils/logger";
import { createSplashWindow, showSplashError } from "./windows/splashWindow";
import { launchFrontend, killFrontendProcess, getFrontendPort } from "./frontend/frontendManager";
import { initLicenseManager, onAppLaunch, verifyStoredLicense, setLicenseValid, showLicenseWindow, getIsLicenseValid, LicenseManager } from "../lib/licenseManager"; // Added LicenseManager
import { createLicenseWindow } from "./windows/licenseWindow";
import { launchBackend, killAllProcesses, getBackendPort } from "./backend/backendManager";
import { storageManager } from "./utils/storageManager";
import { appStore, Store } from "./utils/store"; // Added Store
import { backendManager } from "./backendManager";
import { setupIpcHandlers } from "./ipc/ipcHandlers";

// Constants
const isDev = process.env.NODE_ENV === "development";
const ROOT = path.join(__dirname, "../../"); // Changed import.meta.dir to __dirname

// Splash screen flag - set to false to disable splash screen
const SHOW_SPLASH_SCREEN = false;

// Global state
let store: Store | null = null;
let licenseManager: LicenseManager | null = null;
let appStartTime: number | null = null;

/**
 * Creates the main application window.
 * @param onReady Callback when the window is ready.
 * @param frontendUrl The URL of the frontend to load.
 * @returns A promise that resolves to the created window.
 */
async function createMainAppWindow(onReady: () => void, frontendUrl: string) {
  Logger.log("Creating main app window");
  const mainWindow = await newWindow({
    title: "Electrobun App",
    width: 1200,
    height: 800,
    url: frontendUrl,
    // Other window options can be added here
  });

  mainWindow.onReady().then(onReady);
  return mainWindow;
}

/**
 * Sets up global shortcuts (placeholder for Electrobun equivalent)
 */
function setupGlobalShortcuts() {
  Logger.log("Global shortcuts are not directly supported in Electrobun like in Electron. Skipping.");
  // TODO: If global shortcuts are needed, investigate Electrobun\'s capabilities or alternative solutions.
}

// Electrobun app lifecycle events
// This is a simplified representation. Electrobun handles many lifecycle events internally.
// You might need to adapt these based on Electrobun's specific API for app readiness, etc.

// This function will be called when Electrobun is ready to create browser windows.
// It's analogous to Electron's app.whenReady().then(() => { ... });
async function initializeApp() {
  appStartTime = Date.now();
  Logger.log("App starting up");

  try {
    // Initialize store
    store = new Store();
    await store.init();

    // Initialize LicenseManager
    licenseManager = new LicenseManager(store, isDev, ROOT);
    await licenseManager.init();

    let splashWindowInstance: any = null;

    // Create and show splash window immediately (if enabled)
    if (SHOW_SPLASH_SCREEN) {
      Logger.log("Creating splash window");
      splashWindowInstance = await createSplashWindow();
    }

    // Setup global shortcuts
    setupGlobalShortcuts();

    // Initialize storageManager
    // storageManager.init(ROOT, isDev); // Removed the call to init as it doesn't exist

    // Initialize AppStore
    await appStore.init();

    // Initialize LicenseManager
    initLicenseManager(appStore, isDev, ROOT, createMainAppWindow, createLicenseWindow);

    // Setup IPC handlers
    setupIpcHandlers(licenseManager, isDev);

    // Start the app launch sequence
    Logger.log("Starting app launch sequence");
    if (licenseManager) {
      await licenseManager.onAppLaunch(createMainAppWindow);
    }

    const frontendUrl = await launchFrontend(isDev, ROOT);

    // Launch backend in production mode
    if (!isDev) {
      await launchBackend(isDev, ROOT, frontendUrl, 5000); // TODO: Get actual frontend port
    }

    const mainWindow = await createMainAppWindow(() => {
      Logger.log("Main window content loaded.");
      // Additional actions after main window content is loaded
    }, frontendUrl);

    // Once the main window is ready, close the splash window
    mainWindow.then((win) => { // Changed win: any to win
      if (splashWindowInstance) {
        splashWindowInstance.then((splashWin: any) => splashWin.close()); // Changed win: any to splashWin
      }
    });

    const elapsed = Date.now() - appStartTime;
    Logger.log(`App launch sequence completed (took ${elapsed}ms)`);
  } catch (error: any) {
    Logger.error("Startup error:", error);

    // Show error in splash window instead of dialog (if splash is enabled)
    if (SHOW_SPLASH_SCREEN) {
      try {
        await showSplashError(`Startup error: ${error.message}`);
      } catch (splashError: any) {
        // Fallback to console error and exit if splash error fails
        Logger.error("Splash error fallback:", splashError);
        process.exit(1);
      }
    } else {
      // Directly log error and exit if splash is disabled
      Logger.error("Startup error (splash disabled):", error);
      process.exit(1);
    }
  }
}

initializeApp();

// Electrobun app lifecycle events
// This is a simplified representation. Electrobun handles many lifecycle events internally.
// You might need to adapt these based on Electrobun's specific API for app readiness, etc.

// This function will be called when Electrobun is ready to create browser windows.
// It's analogous to Electron's app.whenReady().then(() => { ... });

// Electrobun might handle single instance applications differently, or this functionality might need to be implemented manually.

// Placeholder for app.on("window-all-closed") and app.on("before-quit")
// The process.on("exit") handler serves as a general cleanup mechanism for now.
// TODO: Investigate Electrobun's specific lifecycle events for these.

// The process.on("exit") handler serves as a general cleanup mechanism for application termination.

// Placeholder for app.on("activate") (macOS specific)
// Electrobun might not have a direct equivalent for app.on("activate"). Manual implementation might be needed if this functionality is required.

process.on("exit", () => {
  killAllProcesses();
});

export { createMainAppWindow as createMainWindow, isDev, ROOT };