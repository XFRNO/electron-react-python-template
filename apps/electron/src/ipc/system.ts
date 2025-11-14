import { ipcMain, shell, dialog, BrowserWindow, app } from 'electron'
import { Logger } from '../utils/logger.js'
import { licenseManager } from '../lib/licenseManager.js' // Changed import to licenseManager
import { IS_DEV } from '@repo/constants'

/**
 * Sets up system-related IPC handlers
 * @param createWindow - Function to create main window
 */
export function setupSystemHandlers(
  createWindow: () => Promise<BrowserWindow> // Changed return type to Promise<BrowserWindow>
): void {
  // Restart app
  ipcMain.handle('restart-app', async () => {
    try {
      // Close all windows
      BrowserWindow.getAllWindows().forEach((window) => {
        window.close()
      })

      // Reset license manager state
      await licenseManager.clearLicense() // Changed to call clearLicense method

      // Re-launch the app flow
      // Removed invalid dynamic import for onAppLaunch
      setImmediate(() => {
        licenseManager.onAppLaunch(createWindow) // Call onAppLaunch via existing licenseManager instance
      })

      return { success: true }
    } catch (error) {
      Logger.error('Error restarting app:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Get app info
  ipcMain.handle('get-app-info', () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      isDev: IS_DEV
    }
  })

  // Show item in folder
  ipcMain.handle('show-item-in-folder', async (_event, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
      return { success: true }
    } catch (error) {
      Logger.error('Error showing item in folder:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Select output folder
  ipcMain.handle('select-output-folder', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      })

      if (result.canceled) {
        return { success: false, error: 'User canceled folder selection' }
      }

      return { success: true, path: result.filePaths[0] }
    } catch (error) {
      Logger.error('Error selecting output folder:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
