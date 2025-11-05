/**
 * Gets an available port for backend server
 * @returns {Promise<number>} Available port number
 */
export async function getPort(): Promise<number> {
  const gp = (await import("get-port")).default;
  return gp();
}
