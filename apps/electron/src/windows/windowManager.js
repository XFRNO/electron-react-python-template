const { Logger } = require("../utils/logger");
const { showMainWindow, isMainWindowReady } = require("./mainWindow");
const { closeSplashWindow, getSplashWindow } = require("./splashWindow");
const { closeLicenseWindow } = require("./licenseWindow");

let backendStarted = false;
let windowShowStartTime = null;

/**
 * Sets the backend started state
 * @param {boolean} started - Whether the backend has started
 */
function setBackendStarted(started) {
  backendStarted = started;
  Logger.log(`Backend started state: ${started}`);

  // Check if we can show main window now
  checkAndShowMainWindow();
}

/**
 * Gets the backend started state
 * @returns {boolean}
 */
function isBackendStarted() {
  return backendStarted;
}

/**
 * Checks if both conditions are met and shows main window
 * @param {boolean} closeLicenseWindowFlag - Whether to close the license window
 */
function checkAndShowMainWindow(closeLicenseWindowFlag = true) {
  // If splash screen is disabled, show main window immediately
  const SHOW_SPLASH_SCREEN = false; // This should match the flag in main.js

  if (!SHOW_SPLASH_SCREEN) {
    // No splash screen, show main window immediately when ready
    if (isMainWindowReady()) {
      showMainWindow();
      // Don't close license window here as it might be intentionally shown
    }
    return;
  }

  if (backendStarted && isMainWindowReady()) {
    const elapsed = windowShowStartTime ? Date.now() - windowShowStartTime : 0;
    Logger.log(
      `Both backend started and main window ready - showing main window (waited ${elapsed}ms)`
    );
    showMainWindowAndCloseSplash(closeLicenseWindowFlag);
  } else if (isMainWindowReady() && !backendStarted) {
    // In lazy loading, we can show the window even before backend is ready
    const elapsed = windowShowStartTime ? Date.now() - windowShowStartTime : 0;
    Logger.log(
      `Main window ready, backend not yet ready - showing main window immediately (waited ${elapsed}ms)`
    );
    showMainWindowAndCloseSplash(closeLicenseWindowFlag);
  }
}

/**
 * Shows main window and closes splash immediately
 * @param {boolean} closeLicenseWindowFlag - Whether to close the license window
 */
function showMainWindowAndCloseSplash(closeLicenseWindowFlag = true) {
  try {
    // Show main window first
    showMainWindow();

    // Close splash window immediately after main window is shown
    Logger.log("Closing splash window");
    closeSplashWindow();

    // Also close license window if it exists and flag is true
    if (closeLicenseWindowFlag) {
      Logger.log("Closing license window");
      closeLicenseWindow();
    } else {
      Logger.log("Skipping license window close as requested");
    }
  } catch (error) {
    Logger.error("Error during window transition:", error);
    // Fallback: just show main window and close splash
    Logger.log("Fallback: closing windows after error");
    closeSplashWindow();
    if (closeLicenseWindowFlag) {
      closeLicenseWindow();
    }
    showMainWindow();
  }
}

/**
 * Resets the window manager state
 */
function resetWindowManagerState() {
  backendStarted = false;
  windowShowStartTime = Date.now();
  Logger.log("Window manager state reset");
}

module.exports = {
  setBackendStarted,
  isBackendStarted,
  checkAndShowMainWindow,
  showMainWindowAndCloseSplash,
  resetWindowManagerState,
};
