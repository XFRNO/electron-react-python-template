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
}