const path = require("path");
const fs = require("fs");
const { Logger } = require("../utils/logger");

let frontendPort = null;

/**
 * Gets an available port
 * @returns {Promise<number>} Available port number
 */
async function getPort() {
  const gp = (await import("get-port")).default;
  return gp();
}

let waitOn = null;

/**
 * Lazily loads wait-on only in dev
 */
async function loadWaitOn() {
  if (!waitOn) {
    const mod = await import("wait-on");
    waitOn = mod.default || mod;
  }
  return waitOn;
}

/**
 * Launches the frontend development server or returns production path
 * @param {boolean} isDev - Whether running in development mode
 * @param {string} rootPath - Root path of the application
 * @returns {Promise<string>} Frontend URL or path
 */
async function launchFrontend(isDev, rootPath) {
  const startTime = Date.now();
  Logger.log(`Launching frontend (${isDev ? "dev" : "prod"})`);

  const FRONTEND = isDev
    ? path.join(rootPath, "../frontend")
    : path.join(process.resourcesPath, "frontend");

  if (isDev) {
    // In development, DO NOT spawn the Vite server.
    // Turborepo orchestrates the dev processes.
    // We simply wait for the existing dev server and return its URL.
    const envUrl = process.env.FRONTEND_URL;
    const envPort = process.env.FRONTEND_PORT;
    const url = envUrl || `http://localhost:${envPort || 5173}`;

    try {
      const waitOnModule = await loadWaitOn();
      await waitOnModule({ resources: [url], timeout: 30000 });
      const parsed = new URL(url);
      frontendPort = Number(parsed.port) || 5173;
      Logger.log(
        `✅ Frontend dev server detected at ${url} (took ${Date.now() - startTime}ms)`
      );
      return url;
    } catch (err) {
      Logger.error(
        `❌ Frontend dev server not reachable at ${url}: ${err.message}`
      );
      throw err;
    }
  }

  const prodIndex = path.join(FRONTEND, "index.html");

  // In production, wait a bit for files to be fully available
  if (!isDev) {
    // Add a small delay to ensure files are fully available
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (!fs.existsSync(prodIndex)) {
    throw new Error(`❌ Production frontend not found at ${prodIndex}`);
  }

  // In production, we return the path for loadFile to use directly
  Logger.log(`✅ Using local production build (${Date.now() - startTime}ms)`);
  return prodIndex; // Return path for loadFile, not file:// URL
}

/**
 * Kills the frontend process if running
 */
function killFrontendProcess() {
  // No-op in the new dev flow since Electron no longer spawns the dev server.
  // Left in place for production safety and backwards compatibility.
}

/**
 * Gets the current frontend port
 * @returns {number|null}
 */
function getFrontendPort() {
  return frontendPort;
}

module.exports = {
  launchFrontend,
  killFrontendProcess,
  getFrontendPort,
};
