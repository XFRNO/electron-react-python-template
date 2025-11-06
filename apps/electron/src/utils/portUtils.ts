import { Logger } from "./logger";

export async function getAvailablePort(options?: { port?: number }): Promise<number> {
  try {
    const getPort = (await import("get-port")).default;
    const availablePort = await getPort(options);
    Logger.log(`Allocated port: ${availablePort}`);
    return availablePort;
  } catch (error) {
    Logger.error("Error getting available port:", error);
    throw error;
  }
}