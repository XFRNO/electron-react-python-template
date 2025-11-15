import { ipcMain, shell, dialog, app } from 'electron'
import { Logger } from '../utils/logger.js'
import { IS_DEV } from '@repo/constants'

export function setupSystemHandlers(): void {
  ipcMain.handle('restart-app', async () => {
    try {
      app.relaunch()
      app.exit()
      return { success: true }
    } catch (error) {
      Logger.error('Error restarting app:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('get-app-info', () => ({
    name: app.getName(),
    version: app.getVersion(),
    isDev: IS_DEV
  }))

  ipcMain.handle('show-item-in-folder', async (_event, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
      return { success: true }
    } catch (error) {
      Logger.error('Error showing item in folder:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('select-output-folder', async () => {
    try {
      const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
      if (result.canceled) return { success: false, error: 'User canceled folder selection' }
      return { success: true, path: result.filePaths[0] }
    } catch (error) {
      Logger.error('Error selecting output folder:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
