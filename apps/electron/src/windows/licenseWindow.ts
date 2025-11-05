import { BrowserWindow } from "electron";
import path from "path";
import { Logger } from "../utils/logger";

let licenseWindow: BrowserWindow | null = null;

export async function createLicenseWindow(
  rootPath: string,
  isDev: boolean
): Promise<BrowserWindow> {
  Logger.log("Creating license window");

  if (licenseWindow) {
    licenseWindow.close();
    licenseWindow = null;
  }

  const preloadPath = path.join(rootPath, "electron/src/preload.js");

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
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

  if (isDev) {
    const platform = process.platform;
    let iconPath;

    if (platform === "darwin") {
      iconPath = path.join(rootPath, "assets/icon.icns");
    } else if (platform === "win32") {
      iconPath = path.join(rootPath, "assets/icon.ico");
    } else {
      iconPath = path.join(rootPath, "assets/icon.png");
    }

    windowOptions.icon = iconPath;
  }

  licenseWindow = new BrowserWindow(windowOptions);

  const licenseHtmlPath = isDev
    ? path.join(rootPath, "src/windows/license.html")
    : path.join(process.resourcesPath, "license.html");

  await licenseWindow.loadFile(licenseHtmlPath);

  licenseWindow.once("ready-to-show", () => {
    if (licenseWindow && !licenseWindow.isDestroyed()) {
      licenseWindow.show();
    }
  });

  licenseWindow.on("closed", () => {
    licenseWindow = null;
  });

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

  return licenseWindow;
}

export function closeLicenseWindow(): void {
  if (licenseWindow && !licenseWindow.isDestroyed()) {
    licenseWindow.close();
    licenseWindow = null;
  }
}

export function getLicenseWindow(): BrowserWindow | null {
  return licenseWindow;
}
