const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { Logger } = require("../utils/logger");
const { showSplashError } = require("../windows/splashWindow");
const {
  setBackendStarted,
  checkAndShowMainWindow,
} = require("../windows/windowManager");
const { storageManager } = require("../utils/storageManager");

// Splash screen flag - should match the flag in main.js
const SHOW_SPLASH_SCREEN = false;

let backendProc = null;
let backendPort = null;
let isBackendReady = false;
let backendReadyCallbacks = [];
let pingAttempts = 0;

/**
 * Checks if the backend is ready by pinging the /docs endpoint
 * @param {number} port - The backend port to check
 * @returns {Promise<boolean>} Whether the backend is ready
 */
async function isBackendReadyPing(port) {
  return new Promise((resolve) => {
    const http = require("http");
    const startTime = Date.now();
    const req = http.get(`http://localhost:${port}/docs`, (res) => {
      const elapsed = Date.now() - startTime;
      const isReady = res.statusCode === 200;
      console.log(
        `Backend ping attempt ${++pingAttempts}: ${
          isReady ? "✅ Ready" : "⏳ Not ready"
        } (HTTP ${res.statusCode}, took ${elapsed}ms)`
      );
      resolve(isReady);
    });
    req.on("error", (err) => {
      const elapsed = Date.now() - startTime;
      console.log(
        `Backend ping attempt ${++pingAttempts}: ❌ Error - ${
          err.message
        } (took ${elapsed}ms)`
      );
      resolve(false);
    });
    req.setTimeout(1000, () => {
      const elapsed = Date.now() - startTime;
      console.log(
        `Backend ping attempt ${++pingAttempts}: ⏳ Timeout (took ${elapsed}ms)`
      );
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Waits for backend to be ready by periodically pinging it
 * @param {number} port - The backend port to check
 * @returns {Promise<void>}
 */
async function waitForBackendReady(port) {
  const waitStartTime = Date.now();
  console.log(`Waiting for backend to be ready on port ${port}...`);
  pingAttempts = 0; // Reset ping attempts counter

  // Show main window immediately while waiting for backend
  // Don't close license window as it might be intentionally shown for license verification
  checkAndShowMainWindow(false);

  while (!isBackendReady) {
    const ready = await isBackendReadyPing(port);
    const totalWaitTime = Date.now() - waitStartTime;

    if (ready) {
      isBackendReady = true;
      console.log(`Backend is ready! (Total wait time: ${totalWaitTime}ms)`);

      // Notify all callbacks
      backendReadyCallbacks.forEach((callback) => callback());
      backendReadyCallbacks = [];

      // Set backend started and check if we can show main window
      setBackendStarted(true);
      return;
    }

    // Check if we've exceeded the 30-second timeout
    if (totalWaitTime > 30000) {
      console.log(
        `⚠️  Backend startup taking longer than 30s - still starting... (Total wait time: ${totalWaitTime}ms)`
      );
      // Continue waiting but log every 5 seconds
      if (totalWaitTime % 5000 < 500) {
        // Log every ~5 seconds
        console.log(
          `Still waiting for backend... (Total wait time: ${totalWaitTime}ms)`
        );
      }
    } else {
      console.log(
        `Backend not ready yet, continuing to wait... (Total wait time: ${totalWaitTime}ms)`
      );
    }

    // Wait 500ms before next ping
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * Registers a callback to be called when backend is ready
 * @param {Function} callback - Function to call when backend is ready
 */
function onBackendReady(callback) {
  if (isBackendReady) {
    // If already ready, call immediately
    callback();
  } else {
    // Otherwise, queue for later
    backendReadyCallbacks.push(callback);
  }
}

/**
 * Shows error, either in splash screen or through console
 * @param {string} errorMsg - Error message to show
 */
async function showError(errorMsg) {
  if (SHOW_SPLASH_SCREEN) {
    await showSplashError(errorMsg);
  } else {
    console.error(errorMsg);
  }
}

/**
 * Launches the backend server
 * @param {boolean} isDev - Whether running in development mode
 * @param {string} rootPath - Root path of the application
 * @param {string} frontendURL - Frontend URL for CORS configuration
 * @param {number} frontendPortParam - Frontend port number
 * @returns {Promise<void>}
 */
async function launchBackend(
  isDev,
  rootPath,
  dynamicBackendPort,
  frontendURL,
  frontendPortParam
) {
  console.time("Backend Launch");
  console.log(
    `Starting backend launch (${isDev ? "development" : "production"})`
  );

  // Reset backend ready state
  isBackendReady = false;
  backendReadyCallbacks = [];

  // Use the dynamic port passed from main.js
  backendPort = dynamicBackendPort;

  let BACKEND_EXE;
  console.time("Backend Executable Path Determination");
  if (isDev) {
    const BACKEND_DIR = path.join(rootPath, "../backend");
    BACKEND_EXE =
      process.platform === "win32"
        ? path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
        : path.join(BACKEND_DIR, "venv", "bin", "python3");
  } else {
    // Check for different build types
    const onedirPath =
      process.platform === "win32"
        ? path.join(
            process.resourcesPath,
            "backend",
            "backend_main",
            "backend_main.exe"
          )
        : path.join(
            process.resourcesPath,
            "backend",
            "backend_main",
            "backend_main"
          );

    const onefilePath =
      process.platform === "win32"
        ? path.join(process.resourcesPath, "backend", "backend_main.exe")
        : path.join(process.resourcesPath, "backend", "backend_main");

    // Check what's available and prefer faster options
    if (fs.existsSync(onedirPath)) {
      BACKEND_EXE = onedirPath;
      console.log("Using --onedir build for faster startup");
    } else if (fs.existsSync(onefilePath)) {
      BACKEND_EXE = onefilePath;
      console.log("Using --onefile build");
    } else {
      const errorMsg = `Backend executable not found:\n${onedirPath}\n${onefilePath}`;
      await showError(errorMsg);
      throw new Error(errorMsg);
    }
  }
  console.timeEnd('Backend Executable Path Determination');

  if (!fs.existsSync(BACKEND_EXE)) {
    const errorMsg = `Backend executable not found:\n${BACKEND_EXE}`;
    await showError(errorMsg);
    throw new Error(errorMsg);
  }

  // Get storage paths
  const storagePaths = storageManager.getAllPaths();

  const env = {
    ...process.env,
    PYTHONUNBUFFERED: "1",
    BACKEND_PORT: String(backendPort),
    FRONTEND_PORT: String(frontendPortParam),
    FRONTEND_URL: frontendURL || "",
    COOKIES_PATH: storagePaths.cookiesPath,
    DOWNLOADS_DB_PATH: storagePaths.downloadsDbPath,
  };

  console.log(`Starting backend server on port ${backendPort}`);
  console.log(`Using backend executable: ${BACKEND_EXE}`);
  console.log(`Cookies path: ${storagePaths.cookiesPath}`);
  console.log(`Downloads DB path: ${storagePaths.downloadsDbPath}`);

  if (isDev) {
    const python = BACKEND_EXE;
    const backendDir = path.join(rootPath, "../backend");
    // In development, run with uvicorn directly for better control
    console.time('Spawn Backend Process');
    backendProc = spawn(
      python,
      [
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "127.0.0.1",
        "--port",
        String(backendPort),
        "--reload", // Enable auto-reload in development
      ],
      {
        cwd: backendDir, // Run from backend directory
        env,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    console.timeEnd('Spawn Backend Process');

    // Log backend output for debugging in development too
    backendProc.stdout.on("data", (data) => {
      console.log(`[Backend STDOUT]: ${data.toString().trim()}`);
    });

    backendProc.stderr.on("data", (data) => {
      console.log(`[Backend STDERR]: ${data.toString().trim()}`);
    });

    backendProc.on("error", async (err) => {
      const errorMsg = `Backend process error: ${err.message}`;
      console.error(errorMsg);
      await showError(errorMsg);
    });

    backendProc.on("exit", async (code, signal) => {
      if (code !== 0 && code !== null) {
        const errorMsg = `Backend process exited with code ${code}`;
        console.error(errorMsg);
        await showError(errorMsg);
      } else {
        console.log(`Backend process exited normally with code ${code}`);
      }
    });
  } else {
    // For production, spawn the backend executable
    console.time('Spawn Backend Process');
    backendProc = spawn(BACKEND_EXE, [], {
      cwd: path.dirname(BACKEND_EXE),
      env,
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
      shell: false,
    });
    console.timeEnd('Spawn Backend Process');

    backendProc.unref();

    // Log backend output for debugging
    backendProc.stdout.on("data", (data) => {
      console.log(`[Backend STDOUT]: ${data.toString().trim()}`);
    });

    backendProc.stderr.on("data", (data) => {
      console.log(`[Backend STDERR]: ${data.toString().trim()}`);
    });

    backendProc.on("error", async (err) => {
      const errorMsg = `Backend process error: ${err.message}`;
      console.error(errorMsg);
      await showError(errorMsg);
    });

    backendProc.on("exit", async (code, signal) => {
      if (code !== 0 && code !== null) {
        const errorMsg = `Backend process exited with code ${code}`;
        console.error(errorMsg);
        await showError(errorMsg);
      } else {
        console.log(`Backend process exited normally with code ${code}`);
      }
    });
  }

  // Start background monitoring for backend readiness
  waitForBackendReady(backendPort)
    .then(() => {
      const elapsed = Date.now() - waitStartTime;
      console.log(`Backend started successfully (took ${elapsed}ms)`);
      console.timeEnd('Backend Launch');
    })
    .catch((error) => {
      const errorMsg = `Backend failed to start: ${error.message}`;
      console.error(errorMsg);
      showError(errorMsg);
    });
}

/**
 * Kills the backend process if running
 */
function killBackendProcess() {
  try {
    if (backendProc) {
      backendProc.kill("SIGTERM");
      backendProc = null;
      console.log("Backend process terminated");
    }
  } catch (error) {
    console.error("Error killing backend process:", error);
  }
}

/**
 * Kills all processes (frontend and backend)
 */
function killAllProcesses() {
  // Import here to avoid circular dependency
  try {
    const { killFrontendProcess } = require("../frontend/frontendManager");
    killFrontendProcess();
  } catch (error) {
    console.error("Error importing frontend manager:", error);
  }
  killBackendProcess();
}

/**
 * Gets the current backend port
 * @returns {number|null}
 */
function getBackendPort() {
  return backendPort;
}

module.exports = {
  launchBackend,
  killBackendProcess,
  getBackendPort,
  killAllProcesses,
  onBackendReady, // Export the new function
};
