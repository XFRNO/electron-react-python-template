import { Logger } from "./logger";

const performanceTimers: Map<string, number> = new Map();

export const PerformanceLogger = {
  start: (key: string) => {
    performanceTimers.set(key, performance.now());
    Logger.debug(`Performance measurement started for: ${key}`);
  },

  end: (key: string) => {
    const startTime = performanceTimers.get(key);
    if (startTime) {
      const duration = performance.now() - startTime;
      Logger.debug(`Performance measurement ended for: ${key}. Duration: ${duration.toFixed(2)}ms`);
      performanceTimers.delete(key);
      return duration;
    } else {
      Logger.warn(`Performance measurement ended for: ${key}, but no start time was recorded.`);
      return null;
    }
  },
};