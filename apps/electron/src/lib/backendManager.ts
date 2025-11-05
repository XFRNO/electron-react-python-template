import path from "path";
import fs from "fs";
import { spawn, ChildProcess } from "child_process";
import http from "http";
import { Logger } from "../utils/logger";
import { showSplashError } from "../windows/splashWindow";
import {
  setBackendStarted,
  checkAndShowMainWindow,
} from "../windows/windowManager";
import { storageManager } from "../utils/storageManager";

class BackendManager {
  private backendProcess: ChildProcess | null = null;
  private port: number | null = null;
  private ready = false;
  private readyCallbacks: (() => void)[] = [];
  private pingAttempts = 0;

  public async start(
    isDev: boolean,
    rootPath: string,
    backendPort: number,
    frontendUrl: string,
    frontendPort: number
  ): Promise<void> {
    Logger.time("Backend Launch");
    Logger.log(
      `Starting backend launch (${isDev ? "development" : "production"})`
    );

    this.ready = false;
    this.readyCallbacks = [];
    this.port = backendPort;

    const backendExe = this.getBackendExecutable(isDev, rootPath);

    if (!fs.existsSync(backendExe)) {
      const errorMsg = `Backend executable not found: ${backendExe}`;
      await this.showError(errorMsg);
      throw new Error(errorMsg);
    }

    const storagePaths = storageManager.getAllPaths();
    const env = {
      ...process.env,
      PYTHONUNBUFFERED: "1",
      BACKEND_PORT: String(this.port),
      FRONTEND_PORT: String(frontendPort),
      FRONTEND_URL: frontendUrl || "",
      COOKIES_PATH: storagePaths.cookiesPath,
      DOWNLOADS_DB_PATH: storagePaths.downloadsDbPath,
    };

    Logger.log(`Starting backend server on port ${this.port}`);
    Logger.log(`Using backend executable: ${backendExe}`);

    if (isDev) {
      this.spawnDevelopmentProcess(backendExe, rootPath, env);
    } else {
      this.spawnProductionProcess(backendExe, env);
    }

    this.waitForBackendReady();
  }

  public stop(): void {
    if (this.backendProcess) {
      this.backendProcess.kill("SIGTERM");
      this.backendProcess = null;
      Logger.log("Backend process terminated");
    }
  }

  public getPort(): number | null {
    return this.port;
  }

  public onReady(callback: () => void): void {
    if (this.ready) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  }

  private getBackendExecutable(isDev: boolean, rootPath: string): string {
    Logger.time("Backend Executable Path Determination");
    let backendExe: string;

    if (isDev) {
      const backendDir = path.join(rootPath, "../backend");
      backendExe =
        process.platform === "win32"
          ? path.join(backendDir, "venv", "Scripts", "python.exe")
          : path.join(backendDir, "venv", "bin", "python3");
    } else {
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

      if (fs.existsSync(onedirPath)) {
        backendExe = onedirPath;
        Logger.log("Using --onedir build for faster startup");
      } else if (fs.existsSync(onefilePath)) {
        backendExe = onefilePath;
        Logger.log("Using --onefile build");
      } else {
        const errorMsg = `Backend executable not found:
${onedirPath}
${onefilePath}`;
        this.showError(errorMsg);
        throw new Error(errorMsg);
      }
    }
    Logger.timeEnd("Backend Executable Path Determination");
    return backendExe;
  }

  private spawnDevelopmentProcess(
    backendExe: string,
    rootPath: string,
    env: NodeJS.ProcessEnv
  ) {
    const backendDir = path.join(rootPath, "../backend");
    Logger.time("Spawn Backend Process");
    this.backendProcess = spawn(
      backendExe,
      [
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "127.0.0.1",
        "--port",
        String(this.port),
        "--reload",
      ],
      {
        cwd: backendDir,
        env,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    Logger.timeEnd("Spawn Backend Process");
    this.setupProcessListeners();
  }

  private spawnProductionProcess(backendExe: string, env: NodeJS.ProcessEnv) {
    Logger.time("Spawn Backend Process");
    this.backendProcess = spawn(backendExe, [], {
      cwd: path.dirname(backendExe),
      env,
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
      shell: false,
    });
    Logger.timeEnd("Spawn Backend Process");
    this.backendProcess.unref();
    this.setupProcessListeners();
  }

  private setupProcessListeners(): void {
    if (!this.backendProcess) return;

    this.backendProcess.stdout?.on("data", (data) => {
      Logger.log(`[Backend STDOUT]: ${data.toString().trim()}`);
    });

    this.backendProcess.stderr?.on("data", (data) => {
      Logger.log(`[Backend STDERR]: ${data.toString().trim()}`);
    });

    this.backendProcess.on("error", async (err) => {
      const errorMsg = `Backend process error: ${err.message}`;
      Logger.error(errorMsg);
      await this.showError(errorMsg);
    });

    this.backendProcess.on("exit", async (code) => {
      if (code !== 0 && code !== null) {
        const errorMsg = `Backend process exited with code ${code}`;
        Logger.error(errorMsg);
        await this.showError(errorMsg);
      } else {
        Logger.log(`Backend process exited normally with code ${code}`);
      }
    });
  }

  private async waitForBackendReady(): Promise<void> {
    const waitStartTime = Date.now();
    Logger.log(`Waiting for backend to be ready on port ${this.port}...`);
    this.pingAttempts = 0;

    checkAndShowMainWindow(false);

    while (!this.ready) {
      const isReady = await this.pingBackend();
      const totalWaitTime = Date.now() - waitStartTime;

      if (isReady) {
        this.ready = true;
        Logger.log(`Backend is ready! (Total wait time: ${totalWaitTime}ms)`);
        this.readyCallbacks.forEach((callback) => callback());
        this.readyCallbacks = [];
        setBackendStarted(true);
        Logger.timeEnd("Backend Launch");
        return;
      }

      if (totalWaitTime > 30000) {
        Logger.warn(
          `Backend startup taking longer than 30s - still starting... (Total wait time: ${totalWaitTime}ms)`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  private async pingBackend(): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const req = http.get(`http://localhost:${this.port}/docs`, (res) => {
        const elapsed = Date.now() - startTime;
        const isReady = res.statusCode === 200;
        Logger.log(
          `Backend ping attempt ${++this.pingAttempts}: ${
            isReady ? "✅ Ready" : "⏳ Not ready"
          } (HTTP ${res.statusCode}, took ${elapsed}ms)`
        );
        resolve(isReady);
      });

      req.on("error", (err) => {
        const elapsed = Date.now() - startTime;
        Logger.log(
          `Backend ping attempt ${++this.pingAttempts}: ❌ Error - ${
            err.message
          } (took ${elapsed}ms)`
        );
        resolve(false);
      });

      req.setTimeout(1000, () => {
        const elapsed = Date.now() - startTime;
        Logger.log(
          `Backend ping attempt ${++this.pingAttempts}: ⏳ Timeout (took ${elapsed}ms)`
        );
        req.destroy();
        resolve(false);
      });
    });
  }

  private async showError(errorMsg: string): Promise<void> {
    // In the future, we might re-introduce the splash screen logic here.
    // For now, we just log to the console.
    Logger.error(errorMsg);
  }
}

export const backendManager = new BackendManager();
