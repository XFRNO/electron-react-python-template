/**
 * Simple logger utility for Electron main process
 */
const fs = require("fs");
const path = require("path");

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file path
const logFilePath = path.join(logsDir, "app.log");

class Logger {
  static writeToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage, { encoding: "utf8" });
  }

  static log(message, ...args) {
    const fullMessage = `[LOG] ${message}`;
    console.log(fullMessage, ...args);
    this.writeToFile(
      fullMessage + (args.length > 0 ? " " + args.join(" ") : "")
    );
  }

  static error(message, ...args) {
    const fullMessage = `[ERROR] ${message}`;
    console.error(fullMessage, ...args);
    this.writeToFile(
      fullMessage + (args.length > 0 ? " " + args.join(" ") : "")
    );
  }

  static warn(message, ...args) {
    const fullMessage = `[WARN] ${message}`;
    console.warn(fullMessage, ...args);
    this.writeToFile(
      fullMessage + (args.length > 0 ? " " + args.join(" ") : "")
    );
  }

  static info(message, ...args) {
    const fullMessage = `[INFO] ${message}`;
    console.log(fullMessage, ...args);
    this.writeToFile(
      fullMessage + (args.length > 0 ? " " + args.join(" ") : "")
    );
  }

  static debug(message, ...args) {
    if (process.env.NODE_ENV === "development") {
      const fullMessage = `[DEBUG] ${message}`;
      console.log(fullMessage, ...args);
      this.writeToFile(
        fullMessage + (args.length > 0 ? " " + args.join(" ") : "")
      );
    }
  }

  static time(label) {
    if (process.env.NODE_ENV === "development") {
      console.time(`[TIMER] ${label}`);
    }
  }

  static timeEnd(label) {
    if (process.env.NODE_ENV === "development") {
      console.timeEnd(`[TIMER] ${label}`);
    }
  }
}

module.exports = { Logger };
