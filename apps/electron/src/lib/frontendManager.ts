import path from "path";
import fs from "fs";
import { Logger } from "../utils/logger";
import { waitForResource } from "../utils/waitOnResource";
import { processManager } from "./processManager";
import { getAvailablePort } from "../utils/portUtils";

class FrontendManager {
  private port: number | null = null;
  private process: any = null; // track spawned process

  /**
   * Launch frontend in dev or prod mode
   */
  public async launch(isDev: boolean, rootPath: string): Promise<string> {
    const startTime = Date.now();
    Logger.log(`🚀 Launching frontend (${isDev ? "dev" : "prod"})`);

    const frontendDir = isDev
      ? path.join(rootPath, "/apps/frontend")
      : path.join(process.resourcesPath, "frontend");

    // ---- Development mode ----
    if (isDev) {
      const frontendPort = await getAvailablePort();
      const url = `http://localhost:${frontendPort}`;
      this.port = frontendPort;

      // Spawn Vite dev server
      Logger.log(`Starting Vite dev server on port ${frontendPort}...`);
      this.process = processManager.spawn(
        "frontend-dev-server",
        "pnpm",
        ["run", "dev"],
        {
          cwd: frontendDir,
          env: { ...process.env, PORT: frontendPort.toString() },
        }
      );

      try {
        await waitForResource({ resource: url });
        Logger.log(
          `✅ Frontend dev server running at ${url} (took ${
            Date.now() - startTime
          }ms)`
        );
        return url;
      } catch (err) {
        Logger.error(
          `❌ Frontend dev server not reachable at ${url}: ${(err as Error).message}`
        );
        this.kill();
        throw err;
      }
    }

    // ---- Production mode ----
    const prodIndex = path.join(frontendDir, "index.html");
    if (!fs.existsSync(prodIndex)) {
      throw new Error(`❌ Production frontend not found at ${prodIndex}`);
    }

    Logger.log(`✅ Using local production build (${Date.now() - startTime}ms)`);
    return prodIndex;
  }

  /**
   * Cleanly stops the frontend dev server
   */
  public kill(): void {
    // Use the processManager to kill the frontend dev server by its registered name.
    processManager.kill("frontend-dev-server");
    this.process = null; // Clear the local reference
  }

  public getPort(): number | null {
    return this.port;
  }
}

export const frontendManager = new FrontendManager();
