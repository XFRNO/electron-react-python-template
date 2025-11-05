/**
 * Simple logger utility for Electron main process
 */

let logEnabled = true;

export class Logger {
  static enableLogs() {
    logEnabled = true;
  }

  static disableLogs() {
    logEnabled = false;
  }

  static log(message: string, ...args: any[]) {
    if (logEnabled) {
      const fullMessage = `[LOG] ${message}`;
      console.log(fullMessage, ...args);
    }
  }

  static error(message: string, ...args: any[]) {
    if (logEnabled) {
      const fullMessage = `[ERROR] ${message}`;
      console.error(fullMessage, ...args);
    }
  }

  static warn(message: string, ...args: any[]) {
    if (logEnabled) {
      const fullMessage = `[WARN] ${message}`;
      console.warn(fullMessage, ...args);
    }
  }

  static info(message: string, ...args: any[]) {
    if (logEnabled) {
      const fullMessage = `[INFO] ${message}`;
      console.log(fullMessage, ...args);
    }
  }

  static debug(message: string, ...args: any[]) {
    if (logEnabled && process.env.NODE_ENV === "development") {
      const fullMessage = `[DEBUG] ${message}`;
      console.log(fullMessage, ...args);
    }
  }

  static time(label: string) {
    if (logEnabled && process.env.NODE_ENV === "development") {
      console.time(`[TIMER] ${label}`);
    }
  }

  static timeEnd(label: string) {
    if (logEnabled && process.env.NODE_ENV === "development") {
      console.timeEnd(`[TIMER] ${label}`);
    }
  }
}
