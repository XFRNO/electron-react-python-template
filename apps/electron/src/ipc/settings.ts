import { ipcMain } from 'electron'
import { Logger } from '../utils/logger.js'
import { storeManager } from '../utils/storeManager.js' // Import Settings interface

/**
 * Sets up settings-related IPC handlers
 */
export function setupSettingsHandlers(): void {
  // Get app settings
  ipcMain.handle('get-app-settings', async () => {
    try {
      const result = await storeManager.getAppSettings()
      return result
    } catch (error) {
      Logger.error('Error getting app settings:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Update app settings
  ipcMain.handle('update-app-settings', async (newSettings: any) => {
    try {
      const result = await storeManager.updateAppSettings(newSettings)
      return result
    } catch (error) {
      Logger.error('Error updating app settings:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
