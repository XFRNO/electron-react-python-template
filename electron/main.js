const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const waitOn = require("wait-on");
const {
  launchBackend,
  killBackendProcess,
} = require("./src/main/backend/backendManager");

const isDev = !app.isPackaged;

/* ---------- constants / defaults --------------------------------------- */
const DEFAULT_OPTIONS = { outputDir: app.getPath("downloads") };

/* ---------- global refs ------------------------------------------------- */
let mainWindow = null;
let frontendProc = null;
let backendProc = null;
let frontendPort = null;
let backendPort = null;
let store = null;

/* ---------- helper paths ------------------------------------------------ */
const ROOT = __dirname;
const FRONTEND = isDev
  ? path.join(ROOT, "../frontend")
  : path.join(process.resourcesPath, "frontend");

const BACKEND_DIR = path.join(ROOT, "../backend");
const BACKEND_EXE = isDev
  ? process.platform === "win32"
    ? path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
    : path.join(BACKEND_DIR, "venv", "bin", "python3.10")
  : process.platform === "win32"
  ? path.join(process.resourcesPath, "backend", "backend_main.exe")
  : path.join(process.resourcesPath, "backend", "backend_main");

// Debug log
console.log(`Backend executable path: ${BACKEND_EXE}`);

/* ---------- utilities --------------------------------------------------- */
async function getPort() {
  const gp = (await import("get-port")).default;
  return gp();
}

function killChildren() {
  console.log("Killing child processes...");
  try {
    if (frontendProc) {
      console.log("Killing frontend process...");
      frontendProc.kill("SIGTERM");
      frontendProc = null;
    }
  } catch (error) {
    console.error("Error killing frontend process:", error);
  }

  try {
    killBackendProcess(); // Use the killBackendProcess from backendManager
  } catch (error) {
    console.error("Error killing backend process:", error);
  }

  console.log("Child processes killed");
}

/* ---------- frontend (Vite/TanStack) ----------------------------------- */
async function launchFrontend() {
  frontendPort = await getPort();
  const url = `http://localhost:${frontendPort}`;

  if (isDev) {
    console.log("🟢  Starting Vite frontend (dev)…");
    const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
    frontendProc = spawn(
      cmd,
      ["run", "dev", "--", "--port", String(frontendPort)],
      { cwd: FRONTEND, shell: true, stdio: "inherit" }
    );
  } else {
    console.log("🔵  Loading frontend dist…");
    // In prod, just load the index.html built by Vite
    return `file://${path.join(FRONTEND, "index.html")}`;
  }

  await waitOn({ resources: [url], timeout: 20000 });
  return url;
}

/* ---------- backend (FastAPI) ------------------------------------------ */
// Removed the duplicate launchBackend function from here

/* ---------- BrowserWindow ---------------------------------------------- */
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(ROOT, "preload.js"),
    },
  });

  // Add event listeners for debugging
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Main window finished loading");
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("Main window failed to load:", errorCode, errorDescription);
    }
  );

  // Handle the window close event to ensure clean shutdown
  mainWindow.on("close", (event) => {
    console.log("Window close event received");
  });

  if (isDev) {
    const url = await launchFrontend();
    await launchBackend(isDev, ROOT, url, frontendPort); // Use the launchBackend from backendManager
    console.log(`Loading frontend in dev mode: ${url}`);
    mainWindow.loadURL(url);
  } else {
    const url = await launchFrontend(); // Launch frontend first to get the port
    await launchBackend(isDev, ROOT, url, frontendPort); // Use the launchBackend from backendManager
    const frontendPath = path.join(FRONTEND, "index.html");
    console.log(`Loading frontend in prod mode from: ${frontendPath}`);
    mainWindow.loadFile(frontendPath);
  }

  mainWindow.on("closed", () => {
    console.log("Window closed event received");
    mainWindow = null;
  });
}

/* ---------- Electron lifecycle ----------------------------------------- */
app.whenReady().then(async () => {
  const { default: Store } = await import("electron-store");
  store = new Store();

  ipcMain.handle("get-ports", () => ({ frontendPort, backendPort }));

  try {
    await createWindow();
  } catch (e) {
    console.error(e);
    dialog.showErrorBox("Startup error", String(e));
    app.quit();
  }
});

app.on("second-instance", () => {
  mainWindow?.show();
  mainWindow?.focus();
});

// Modified to always quit the app when all windows are closed, regardless of platform
app.on("window-all-closed", () => {
  console.log("All windows closed, quitting app...");
  killChildren();
  app.quit();
});

app.on("before-quit", () => {
  console.log("App before-quit event received");
  killChildren();
});

process.on("exit", () => {
  console.log("Process exit event received");
  killChildren();
});

// Add this to handle the window close event properly
app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  console.log("App activate event received");
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// electron/main.ts
ipcMain.handle("get-app-info", () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    isDev,
  };
});

// ✅ Add this
ipcMain.handle("get-backend-info", () => {
  return {
    backendPort,
    url: `http://localhost:${backendPort}`,
    status: backendPort ? "running" : "not-started",
  };
});
