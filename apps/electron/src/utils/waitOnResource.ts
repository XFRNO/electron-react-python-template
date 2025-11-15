import waitOn from 'wait-on'

/**
 * Waits for a given resource (URL, file, or socket) to become available.
 * @param resource - The URL or file path to wait for.
 * @param timeout - Timeout in ms (default: 30s)
 */
export async function waitForResource({
  resource,
  timeout = 30000
}: {
  resource: string
  timeout?: number
}): Promise<void> {
  try {
    await waitOn({ resources: [resource], timeout })
  } catch (err) {
    throw err
  }
}
