import { BrowserWindow, app } from "electron";
import path from "path";
import { Logger } from "../utils/logger.js";

let splashWindow: BrowserWindow | null = null;

export async function createSplashWindow(): Promise<BrowserWindow> {
  const ROOT = path.join(__dirname, "../../../");

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
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

  if (!app.isPackaged) {
    const platform = process.platform;
    let iconPath;

    if (platform === "darwin") {
      iconPath = path.join(ROOT, "assets/icon.icns");
    } else if (platform === "win32") {
      iconPath = path.join(ROOT, "assets/icon.ico");
    } else {
      iconPath = path.join(ROOT, "assets/icon.png");
    }

    windowOptions.icon = iconPath;
  }

  splashWindow = new BrowserWindow(windowOptions);

  splashWindow.loadFile(path.join(ROOT, "src/html/splash.html"));

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

export async function showSplashError(errorMessage: string): Promise<void> {
  if (splashWindow && !splashWindow.isDestroyed()) {
    await splashWindow.webContents.executeJavaScript(`
      window.splashApi.showError("${errorMessage
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")}");
    `);
  }
}

export function closeSplashWindow(): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
    Logger.log("Splash window closed immediately");
  }
}

export function getSplashWindow(): BrowserWindow | null {
  return splashWindow;
}
