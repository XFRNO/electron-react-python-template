const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const waitOn = require("wait-on");

const isDev = !app.isPackaged;

/* ---------- constants / defaults --------------------------------------- */
let mainWindow = null;
let backendProc = null;
let frontendPort = 5173; // Default for Vite
let backendPort = 8001; // Default for FastAPI

/* ---------- helper paths ------------------------------------------------ */
const ROOT = __dirname;
const FRONTEND = isDev
  ? `http://localhost:${frontendPort}`
  : `file://${path.join(process.resourcesPath, "frontend", "index.html")}`;

const BACKEND_DIR = path.join(ROOT, "../backend");
const BACKEND_EXE = isDev
  ? null // handled by Turborepo
  : process.platform === "win32"
    ? path.join(process.resourcesPath, "backend", "backend_main.exe")
    : path.join(process.resourcesPath, "backend", "backend_main");

/* ---------- kill children safely --------------------------------------- */
function killChildren() {
  console.log("Killing backend process...");
  try {
    if (backendProc) {
      backendProc.kill("SIGTERM");
      backendProc = null;
    }
  } catch (err) {
    console.error("Error killing backend:", err);
  }
}

/* ---------- wait for backend/frontend in dev --------------------------- */
async function waitForServices() {
  console.log("⏳ Waiting for backend and frontend...");
  await waitOn({
    resources: [
      `http://localhost:${frontendPort}`,
      `http://127.0.0.1:${backendPort}`,
    ],
    timeout: 30000,
    interval: 500,
    simultaneous: 2,
  });
  console.log("✅ Backend and Frontend are up!");
}

/* ---------- create main window ----------------------------------------- */
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(ROOT, "preload.js"),
      contextIsolation: true,
    },
  });

  if (isDev) {
    // In dev, Turborepo already runs both
    try {
      await waitForServices();
      await mainWindow.loadURL(FRONTEND);
      mainWindow.webContents.openDevTools();
      console.log(`🟢 Loaded frontend from ${FRONTEND}`);
    } catch (err) {
      console.error("Failed waiting for dev servers:", err);
      dialog.showErrorBox("Startup error", String(err));
      app.quit();
    }
  } else {
    // Production — launch backend binary
    console.log("🔵 Launching backend binary…");
    backendProc = spawn(BACKEND_EXE, [], {
      cwd: BACKEND_DIR,
      stdio: "inherit",
    });

    backendProc.on("exit", (code) =>
      console.log("Backend process exited with code", code)
    );

    const frontendPath = path.join(
      process.resourcesPath,
      "frontend",
      "index.html"
    );
    await mainWindow.loadFile(frontendPath);
    console.log("✅ Loaded production frontend");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/* ---------- Electron lifecycle ----------------------------------------- */
app.whenReady().then(async () => {
  await createWindow();
});

app.on("window-all-closed", () => {
  killChildren();
  app.quit();
});

app.on("before-quit", () => {
  killChildren();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/* ---------- IPC handlers ----------------------------------------------- */
ipcMain.handle("get-app-info", () => ({
  name: app.getName(),
  version: app.getVersion(),
  isDev,
}));

ipcMain.handle("get-backend-info", () => ({
  backendPort,
  url: `http://localhost:${backendPort}`,
  status: backendPort ? "running" : "not-started",
}));
