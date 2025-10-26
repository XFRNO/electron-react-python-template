const { app } = require("electron");
const fs = require("fs");
const path = require("path");
const { Logger } = require("./logger");

class StorageManager {
  constructor() {
    // Get the user data directory from Electron
    this.userDataPath = app.getPath("userData");

    // Define file paths - use user-downloaded-cookies.txt instead of cookies.txt
    this.cookiesPath = path.join(
      this.userDataPath,
      "user-downloaded-cookies.txt"
    );
    this.downloadsDbPath = path.join(this.userDataPath, "downloads.db");
    this.logsPath = path.join(this.userDataPath, "logs");

    // Ensure directories exist
    this.ensureDirectories();

    // Log the resolved paths
    Logger.log(`Storage paths initialized:`);
    Logger.log(`  User data directory: ${this.userDataPath}`);
    Logger.log(`  Cookies path: ${this.cookiesPath}`);
    Logger.log(`  Downloads DB path: ${this.downloadsDbPath}`);
    Logger.log(`  Logs directory: ${this.logsPath}`);
  }

  /**
   * Ensures all required directories exist
   */
  ensureDirectories() {
    try {
      // Create user data directory if it doesn't exist (should already exist)
      if (!fs.existsSync(this.userDataPath)) {
        fs.mkdirSync(this.userDataPath, { recursive: true });
        Logger.log(`Created user data directory: ${this.userDataPath}`);
      }

      // Create logs directory if it doesn't exist
      if (!fs.existsSync(this.logsPath)) {
        fs.mkdirSync(this.logsPath, { recursive: true });
        Logger.log(`Created logs directory: ${this.logsPath}`);
      }
    } catch (error) {
      Logger.error(`Error ensuring directories exist: ${error.message}`);
      throw error;
    }
  }

  /**
   * Returns the full path to the cookies file
   * @returns {string} Full path to user-downloaded-cookies.txt
   */
  getCookiesPath() {
    return this.cookiesPath;
  }

  /**
   * Returns the full path to the downloads database
   * @returns {string} Full path to downloads.db
   */
  getDownloadsDbPath() {
    return this.downloadsDbPath;
  }

  /**
   * Returns the full path to the logs directory
   * @returns {string} Full path to logs directory
   */
  getLogsPath() {
    return this.logsPath;
  }

  /**
   * Returns all storage paths
   * @returns {Object} Object containing all storage paths
   */
  getAllPaths() {
    return {
      userDataPath: this.userDataPath,
      cookiesPath: this.cookiesPath,
      downloadsDbPath: this.downloadsDbPath,
      logsPath: this.logsPath,
    };
  }
}

// Create a singleton instance
const storageManager = new StorageManager();

module.exports = {
  storageManager,
};
