import { BrowserWindow, app } from "electron";
import path from "path";
import { Logger } from "../utils/logger";

let mainWindow: BrowserWindow | null = null;
let isRefreshing = false;
let contentLoadTimeout: NodeJS.Timeout | null = null;
const isDev = !app.isPackaged;

export async function createMainWindow(
  onContentLoaded: () => void
): Promise<BrowserWindow> {
  const ROOT = path.join(__dirname, "../../../");

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    title: "Video Downloader",
    width: 800,
    height: 1000,
    show: false,
    backgroundColor: "#1a1a1a",
    webPreferences: {
      contextIsolation: true,
      preload: path.join(ROOT, "electron/src/preload.js"),
      webSecurity: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
  };

  if (isDev) {
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

  mainWindow = new BrowserWindow(windowOptions);

  setupMainWindowEvents(onContentLoaded);

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (contentLoadTimeout) {
      clearTimeout(contentLoadTimeout);
      contentLoadTimeout = null;
    }
  });

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

function setupMainWindowEvents(onContentLoaded: () => void): void {
  if (!mainWindow) return;

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const currentURL = mainWindow!.webContents.getURL();
    if (currentURL && url === currentURL) {
      isRefreshing = true;
    }
  });

  if (!isDev) {
    contentLoadTimeout = setTimeout(() => {
      if (!isRefreshing && mainWindow && !mainWindow.isDestroyed()) {
        if (onContentLoaded) {
          onContentLoaded();
        }
      }
    }, 100);
  }

  mainWindow.webContents.on("did-finish-load", () => {
    if (contentLoadTimeout) {
      clearTimeout(contentLoadTimeout);
      contentLoadTimeout = null;
    }

    if (isRefreshing) {
      isRefreshing = false;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      if (onContentLoaded) {
        onContentLoaded();
      }
    }
  });

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
    }, 5000);
  }
}

export function loadMainWindowContent(urlOrPath: string): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (isDev) {
      mainWindow.loadURL(urlOrPath);
    } else {
      mainWindow.loadFile(urlOrPath);
    }
  }
}

export function showMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function isMainWindowReady(): boolean {
  return mainWindow && !mainWindow.isDestroyed() && !isRefreshing;
}

export function resetRefreshState(): void {
  isRefreshing = false;
}
