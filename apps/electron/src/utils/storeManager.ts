// src/utils/storeManager.ts

import { app } from "electron";
import fs from "fs";
import path from "path";
import ElectronStore, { type Schema } from "electron-store";
import { Logger } from "./logger.js";

/**
 * Type definition for persistent store data.
 */
export interface TStoreData {
  backendPort?: number;
  licenseKey?: string;
  default_output_path?: string;
  default_format?: string;
  default_quality?: string;
}

/**
 * Schema definition for the ElectronStore.
 */
const schema: Schema<TStoreData> = {
  backendPort: { type: "number" },
  licenseKey: { type: "string" },
  default_output_path: { type: "string" },
  default_format: { type: "string" },
  default_quality: { type: "string" },
};

/**
 * Manages app data storage using electron-store.
 * Handles paths, directories, and persistent config values.
 */
export class StoreManager {
  public readonly userDataPath: string;
  public readonly cookiesPath: string;
  public readonly downloadsDbPath: string;
  public readonly logsPath: string;
  private store: ElectronStore<TStoreData>;

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

    // ✅ Initialize the persistent store
    this.store = new ElectronStore<TStoreData>({
      name: "config",
      schema,
      clearInvalidConfig: true,
    });
  }

  /**
   * Ensures all necessary directories exist.
   */
  private ensureDirectories(): void {
    for (const dir of [this.userDataPath, this.logsPath]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        Logger.log(`Created directory: ${dir}`);
      }
    }
  }

  // ---------- Path Accessors ----------
  public getCookiesPath(): string {
    return this.cookiesPath;
  }

  public getDownloadsDbPath(): string {
    return this.downloadsDbPath;
  }

  public getLogsPath(): string {
    return this.logsPath;
  }

  public getAllPaths(): Record<string, string> {
    return {
      userDataPath: this.userDataPath,
      cookiesPath: this.cookiesPath,
      downloadsDbPath: this.downloadsDbPath,
      logsPath: this.logsPath,
    };
  }

  // ---------- Safe Typed Store Methods ----------

  /**
   * Retrieves a value from the store.
   */
  public get<K extends keyof TStoreData>(key: K): TStoreData[K] | undefined {
    return this.store.get(key);
  }

  /**
   * Sets a value in the store.
   */
  public set<K extends keyof TStoreData>(key: K, value: TStoreData[K]): void {
    this.store.set(key, value);
  }

  /**
   * Deletes a key from the store.
   */
  public delete<K extends keyof TStoreData>(key: K): void {
    this.store.delete(key);
  }
}

/**
 * Singleton instance of the StoreManager.
 */
export const storeManager = new StoreManager();
