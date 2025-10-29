export class Logger {
  static log(...args: any[]) {
    console.log("[Frontend Logger]", ...args);
  }

  static error(...args: any[]) {
    console.error("[Frontend Logger]", ...args);
  }

  static warn(...args: any[]) {
    console.warn("[Frontend Logger]", ...args);
  }

  static debug(...args: any[]) {
    if (import.meta.env.DEV) { // Only log debug messages in development
      console.debug("[Frontend Logger]", ...args);
    }
  }
}