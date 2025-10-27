const path = require("path");
const { spawn } = require("child_process");
const waitOn = require("wait-on");
const fs = require("fs");
const { Logger } = require("../utils/logger");

let frontendProc = null;
let frontendPort = null;

/**
 * Gets an available port
 * @returns {Promise<number>} Available port number
 */
async function getPort() {
  const gp = (await import("get-port")).default;
  return gp();
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
    frontendPort = await getPort();
    const url = `http://localhost:${frontendPort}`;
    const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
    frontendProc = spawn(
      cmd,
      ["run", "dev", "--", "--port", String(frontendPort)],
      {
        cwd: FRONTEND,
        shell: true,
        stdio: "inherit",
      }
    );

    await waitOn({ resources: [url], timeout: 20000 });
    Logger.log(
      `✅ Frontend ready at ${url} (took ${Date.now() - startTime}ms)`
    );
    return url;
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
  try {
    if (frontendProc) {
      frontendProc.kill("SIGTERM");
      frontendProc = null;
      Logger.log("Frontend process terminated");
    }
  } catch (error) {
    Logger.error("Error killing frontend process:", error);
  }
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
