export async function getAvailablePort(options?: { port?: number }): Promise<number> {
  try {
    const getPort = (await import('get-port')).default
    const availablePort = await getPort(options)
    return availablePort
  } catch (error) {
    throw error
  }
}
