import { ipcMain } from "electron";
import { Logger } from "../utils/logger";
import { getBackendPort } from "../lib/backendManager.js";
import { getFrontendPort } from "../lib/frontendManager.js";
import Store from "electron-store";

/**
 * Sets up API-related IPC handlers
 */
export function setupApiHandlers(): void {
  const store = new Store();

  // Get ports information
  ipcMain.handle("get-ports", () => {
    const backendPort = store.get("backendPort");

    return {
      frontendPort: getFrontendPort(),
      backendPort: backendPort || getBackendPort(), // Fallback to original method
    };
  });

  // Get backend info
  ipcMain.handle("get-backend-info", () => {
    const backendPort = getBackendPort();
    return {
      backendPort,
      url: `http://localhost:${backendPort}`,
      status: backendPort ? "running" : "not-started",
    };
  });

  // API call handler
  ipcMain.handle(
    "api-call",
    async (event, endpoint: string, options: RequestInit = {}) => {
      try {
        const backendPort = getBackendPort();
        if (!backendPort) {
          throw new Error("Backend not ready");
        }

        const url = `http://localhost:${backendPort}${endpoint}`;

        const fetchOptions: RequestInit = {
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
        return { success: false, error: (error as Error).message };
      }
    }
  );
}
