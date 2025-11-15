import { ipcMain } from 'electron'
import { Logger } from '../utils/logger.js'
import { licenseManager } from '../lib/licenseManager.js'
import { storeManager } from '../utils/storeManager.js'

export function setupLicenseHandlers(): void {
  ipcMain.handle('verify-license', async (_event, licenseKey: string) => {
    try {
      const result = await licenseManager.verifyLicense(licenseKey)
      if (result.success) {
        ipcMain.emit('license:verified')
      } else if (result.error) {
        if (result.error.includes('deactivated') || result.error.includes('refunded')) {
          await licenseManager.clearLicense()
          storeManager.clearLicense()
        }
      }
      return result
    } catch (error) {
      Logger.error('Error in verify-license handler:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('clear-license', async () => {
    try {
      await licenseManager.clearLicense()
      storeManager.clearLicense()
      return { success: true }
    } catch (error) {
      Logger.error('Error clearing license:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
