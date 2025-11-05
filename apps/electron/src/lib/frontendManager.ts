import path from "path";
import fs from "fs";
import { Logger } from "../utils/logger";
import * as waitOn from "wait-on";

class FrontendManager {
  private port: number | null = null;

  public async launch(isDev: boolean, rootPath: string): Promise<string> {
    const startTime = Date.now();
    Logger.log(`Launching frontend (${isDev ? "dev" : "prod"})`);

    const frontendDir = isDev
      ? path.join(rootPath, "../frontend")
      : path.join(process.resourcesPath, "frontend");

    if (isDev) {
      const envUrl = process.env.FRONTEND_URL;
      const envPort = process.env.FRONTEND_PORT;
      const url = envUrl || `http://localhost:${envPort || 5173}`;

      try {
        await (waitOn as any)({ resources: [url], timeout: 30000 });
        const parsed = new URL(url);
        this.port = Number(parsed.port) || 5173;
        Logger.log(
          `✅ Frontend dev server detected at ${url} (took ${
            Date.now() - startTime
          }ms)`
        );
        return url;
      } catch (err) {
        Logger.error(
          `❌ Frontend dev server not reachable at ${url}: ${
            (err as Error).message
          }`
        );
        throw err;
      }
    }

    const prodIndex = path.join(frontendDir, "index.html");

    if (!fs.existsSync(prodIndex)) {
      throw new Error(`❌ Production frontend not found at ${prodIndex}`);
    }

    Logger.log(`✅ Using local production build (${Date.now() - startTime}ms)`);
    return prodIndex;
  }

  public kill(): void {
    // No-op in the new dev flow since Electron no longer spawns the dev server.
  }

  public getPort(): number | null {
    return this.port;
  }
}

export const frontendManager = new FrontendManager();
