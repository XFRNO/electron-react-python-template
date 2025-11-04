const { ipcMain } = require("electron");
const { Logger } = require("../utils/logger");

/**
 * Sets up API-related IPC handlers
 */
function setupApiHandlers() {
  // Get ports information
  ipcMain.handle("get-ports", () => {
    // Import here to avoid circular dependency
    const { getBackendPort } = require("../backend/backendManager");
    const { getFrontendPort } = require("../frontend/frontendManager");
    return {
      frontendPort: getFrontendPort(),
      backendPort: getBackendPort(),
    };
  });

  // Get backend info
  ipcMain.handle("get-backend-info", () => {
    const { getBackendPort } = require("../backend/backendManager");
    const backendPort = getBackendPort();
    return {
      backendPort,
      url: `http://localhost:${backendPort}`,
      status: backendPort ? "running" : "not-started",
    };
  });

  // API call handler
  ipcMain.handle("api-call", async (event, endpoint, options = {}) => {
    try {
      const { getBackendPort } = require("../backend/backendManager");
      const backendPort = getBackendPort();
      if (!backendPort) {
        throw new Error("Backend not ready");
      }

      const url = `http://localhost:${backendPort}${endpoint}`;

      const fetchOptions = {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      };

      if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(
          `API call failed: ${response.status} ${response.statusText}`
        );
      }

      return { success: true, data };
    } catch (error) {
      Logger.error(`API call error for ${endpoint}:`, error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { setupApiHandlers };
