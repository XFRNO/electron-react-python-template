import waitOn from "wait-on";
import { Logger } from "./logger";

/**
 * Waits for a given resource (URL, file, or socket) to become available.
 * @param resource - The URL or file path to wait for.
 * @param timeout - Timeout in ms (default: 30s)
 */
export async function waitForResource({
  resource,
  timeout = 30000,
}: {
  resource: string;
  timeout?: number;
}): Promise<void> {
  try {
    Logger.info(`⏳ Waiting for resource: ${resource}`);
    await waitOn({ resources: [resource], timeout });
    Logger.info(`✅ Resource available: ${resource}`);
  } catch (err) {
    Logger.error(`❌ Resource not available: ${resource}`, err);
    throw err;
  }
}
