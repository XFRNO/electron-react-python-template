import { app } from "electron";
import fs from "fs";
import path from "path";
import { Logger } from "./logger";

class StorageManager {
  public readonly userDataPath: string;
  public readonly cookiesPath: string;
  public readonly downloadsDbPath: string;
  public readonly logsPath: string;

  constructor() {
    this.userDataPath = app.getPath("userData");
    this.cookiesPath = path.join(
      this.userDataPath,
      "user-downloaded-cookies.txt"
    );
    this.downloadsDbPath = path.join(this.userDataPath, "downloads.db");
    this.logsPath = path.join(this.userDataPath, "logs");

    this.ensureDirectories();

    Logger.log(`Storage paths initialized:`);
    Logger.log(`  User data directory: ${this.userDataPath}`);
    Logger.log(`  Cookies path: ${this.cookiesPath}`);
    Logger.log(`  Downloads DB path: ${this.downloadsDbPath}`);
    Logger.log(`  Logs directory: ${this.logsPath}`);
  }

  private ensureDirectories(): void {
    try {
      if (!fs.existsSync(this.userDataPath)) {
        fs.mkdirSync(this.userDataPath, { recursive: true });
        Logger.log(`Created user data directory: ${this.userDataPath}`);
      }

      if (!fs.existsSync(this.logsPath)) {
        fs.mkdirSync(this.logsPath, { recursive: true });
        Logger.log(`Created logs directory: ${this.logsPath}`);
      }
    } catch (error) {
      Logger.error(
        `Error ensuring directories exist: ${(error as Error).message}`
      );
      throw error;
    }
  }

  public getCookiesPath(): string {
    return this.cookiesPath;
  }

  public getDownloadsDbPath(): string {
    return this.downloadsDbPath;
  }

  public getLogsPath(): string {
    return this.logsPath;
  }

  public getAllPaths(): { [key: string]: string } {
    return {
      userDataPath: this.userDataPath,
      cookiesPath: this.cookiesPath,
      downloadsDbPath: this.downloadsDbPath,
      logsPath: this.logsPath,
    };
  }
}

export const storageManager = new StorageManager();
