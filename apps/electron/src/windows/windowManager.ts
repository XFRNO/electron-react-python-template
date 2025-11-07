import { Logger } from "../utils/logger.js";
import { showMainWindow, isMainWindowReady } from "./mainWindow.js";
import { closeSplashWindow } from "./splashWindow.js";
import { closeLicenseWindow } from "./licenseWindow.js";

let backendStarted = false;
let windowShowStartTime: number | null = null;

export function setBackendStarted(started: boolean): void {
  backendStarted = started;
  Logger.log(`Backend started state: ${started}`);
  checkAndShowMainWindow();
}

export function isBackendStarted(): boolean {
  return backendStarted;
}

export function checkAndShowMainWindow(closeLicenseWindowFlag = true): void {
  const SHOW_SPLASH_SCREEN = false; // This should match the flag in main.js

  if (!SHOW_SPLASH_SCREEN) {
    if (isMainWindowReady()) {
      showMainWindow();
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
    const elapsed = windowShowStartTime ? Date.now() - windowShowStartTime : 0;
    Logger.log(
      `Main window ready, backend not yet ready - showing main window immediately (waited ${elapsed}ms)`
    );
    showMainWindowAndCloseSplash(closeLicenseWindowFlag);
  }
}

function showMainWindowAndCloseSplash(closeLicenseWindowFlag = true): void {
  try {
    showMainWindow();
    closeSplashWindow();
    if (closeLicenseWindowFlag) {
      closeLicenseWindow();
    } else {
      Logger.log("Skipping license window close as requested");
    }
  } catch (error) {
    Logger.error("Error during window transition:", error);
    closeSplashWindow();
    if (closeLicenseWindowFlag) {
      closeLicenseWindow();
    }
    showMainWindow();
  }
}

export function resetWindowManagerState(): void {
  backendStarted = false;
  windowShowStartTime = Date.now();
  Logger.log("Window manager state reset");
}
