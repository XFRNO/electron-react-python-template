import path from "path";
import fs from "fs";
import http from "http";
import { Logger } from "../utils/logger";
import {
  setBackendStarted,
  checkAndShowMainWindow,
} from "../windows/windowManager";
import { processManager } from "./processManager";
// Removed static import of get-port
import { StoreManager } from "../utils/storeManager";

class BackendManager {
  private port: number | null = null;
  private ready = false;
  private readyCallbacks: (() => void)[] = [];
  private pingAttempts = 0;
  private processId: string | null = null; // Track process via processManager

  /**
   * Launches backend process
   */
  public async start(
    isDev: boolean,
    rootPath: string,
    frontendUrl: string,
    frontendPort: number,
    storeManager: StoreManager // Add storeManager as an argument
  ): Promise<void> {
    Logger.time("Backend Launch");
    Logger.log(`🚀 Starting backend (${isDev ? "development" : "production"})`);

    this.ready = false;
    this.readyCallbacks = [];
    this.pingAttempts = 0;

    // Dynamically get available port
    const getPort = (await import("get-port")).default; // Dynamically import get-port
    this.port = Number(process.env.BACKEND_PORT) || (await getPort());
    const backendExe = this.getBackendExecutable(isDev, rootPath);

    if (!fs.existsSync(backendExe)) {
      const msg = `❌ Backend executable not found at: ${backendExe}`;
      Logger.error(msg);
      throw new Error(msg);
    }

    const storagePaths = storeManager.getAllPaths();
    const env = {
      ...process.env,
      PYTHONUNBUFFERED: "1",
      BACKEND_PORT: String(this.port),
      FRONTEND_PORT: String(frontendPort),
      FRONTEND_URL: frontendUrl,
    };

    Logger.log(`Backend starting on port ${this.port}`);

    // Spawn backend process
    if (isDev) {
      const backendDir = path.join(rootPath, "/apps/backend");
      const processName = "backend-dev-server"; // Define the process name
      processManager.spawn(
        processName, // Pass the name to spawn
        backendExe,
        [
          "-m",
          "uvicorn",
          "src.main:app",
          "--host",
          "127.0.0.1",
          "--port",
          String(this.port),
          "--reload",
        ],
        {
          cwd: backendDir,
          env,
        }
      );
      this.processId = processName; // Assign the name to this.processId
    } else {
      const processName = "backend-production"; // Define the process name
      processManager.spawn(
        processName, // Pass the name to spawn
        backendExe,
        [],
        {
          cwd: path.dirname(backendExe),
          env,
          detached: true,
        }
      );
      this.processId = processName; // Assign the name to this.processId
    }

    await this.waitForBackendReady();
  }

  /**
   * Stop backend process safely
   */
  public stop(): void {
    if (this.processId) {
      processManager.kill(this.processId);
      Logger.log(`🛑 Backend process stopped`);
      this.processId = null;
    }
  }

  public getPort(): number | null {
    return this.port;
  }

  public onReady(callback: () => void): void {
    if (this.ready) callback();
    else this.readyCallbacks.push(callback);
  }

  /**
   * Detects backend executable path
   */
  private getBackendExecutable(isDev: boolean, rootPath: string): string {
    Logger.time("Backend Executable Path");
    let backendExe: string;

    if (isDev) {
      const backendDir = path.join(rootPath, "/apps/backend");
      backendExe =
        process.platform === "win32"
          ? path.join(backendDir, ".venv", "Scripts", "python.exe")
          : path.join(backendDir, ".venv", "bin", "python3");
    } else {
      const base = path.join(process.resourcesPath, "backend", "backend_main");
      const oneDir =
        process.platform === "win32"
          ? `${base}\\backend_main.exe`
          : `${base}/backend_main`;
      const oneFile = process.platform === "win32" ? `${base}.exe` : base;

      backendExe = fs.existsSync(oneDir)
        ? oneDir
        : fs.existsSync(oneFile)
          ? oneFile
          : (() => {
              throw new Error(
                `❌ Backend binary not found:\n${oneDir}\n${oneFile}`
              );
            })();
    }

    Logger.timeEnd("Backend Executable Path");
    return backendExe;
  }

  /**
   * Pings backend until /health responds
   */
  private async waitForBackendReady(): Promise<void> {
    const start = Date.now();
    Logger.log(`Waiting for backend on port ${this.port}...`);
    checkAndShowMainWindow(false);

    while (!this.ready) {
      const isReady = await this.pingBackend();
      if (isReady) {
        this.ready = true;
        Logger.log(`✅ Backend ready after ${Date.now() - start}ms`);
        this.readyCallbacks.forEach((cb) => cb());
        this.readyCallbacks = [];
        setBackendStarted(true);
        Logger.timeEnd("Backend Launch");
        return;
      }

      if (Date.now() - start > 30000) {
        Logger.warn("Backend still starting after 30s...");
      }

      await new Promise((r) => setTimeout(r, 500));
    }
  }

  private async pingBackend(): Promise<boolean> {
    return new Promise((resolve) => {
      const start = Date.now();
      const req = http.get(`http://127.0.0.1:${this.port}/health`, (res) => {
        const ok = res.statusCode === 200;
        Logger.debug(
          `Ping ${++this.pingAttempts}: ${ok ? "✅ Ready" : "⏳ Not ready"} (HTTP ${
            res.statusCode
          }) ${Date.now() - start}ms`
        );
        resolve(ok);
      });

      req.on("error", () => resolve(false));
      req.setTimeout(1000, () => req.destroy());
    });
  }
}

export const backendManager = new BackendManager();
