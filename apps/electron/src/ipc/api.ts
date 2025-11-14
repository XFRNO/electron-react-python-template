import { ipcMain } from 'electron'
import { Logger } from '../utils/logger.js'
import { backendManager } from '../lib/backendManager.js'
import { frontendManager } from '../lib/frontendManager.js'

/**
 * Sets up API-related IPC handlers
 */
export function setupApiHandlers(): void {
  // Get ports information
  ipcMain.handle('get-ports', () => {
    const backendPort = backendManager.getPort() // Use backendManager.getPort

    return {
      frontendPort: frontendManager.getPort(),
      backendPort: backendPort || frontendManager.getPort() // Fallback to frontend port if backend port is not available
    }
  })

  // Get backend info
  ipcMain.handle('get-backend-info', () => {
    const backendPort = backendManager.getPort()
    return {
      backendPort,
      url: `http://localhost:${backendPort}`,
      status: backendPort ? 'running' : 'not-started'
    }
  })

  // API call handler
  ipcMain.handle('api-call', async (_event, endpoint: string, options: RequestInit = {}) => {
    try {
      const backendPort = backendManager.getPort()
      if (!backendPort) {
        throw new Error('Backend not ready')
      }

      const url = `http://localhost:${backendPort}${endpoint}`

      const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      }

      if (options.body) {
        fetchOptions.body = JSON.stringify(options.body)
      }

      const response = await fetch(url, fetchOptions)

      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }

      return { success: true, data }
    } catch (error) {
      Logger.error(`API call error for ${endpoint}:`, error)
      return { success: false, error: (error as Error).message }
    }
  })
}
