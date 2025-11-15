import { ipcMain } from 'electron'
import { setupApiHandlers } from './api.js'
import { setupSystemHandlers } from './system.js'
import { setupSettingsHandlers } from './settings.js'
import { setupLicenseHandlers } from './license.js'

export function setupIpcHandlers(): void {
  setupApiHandlers()
  setupSystemHandlers()
  setupSettingsHandlers()
  setupLicenseHandlers()
  ipcMain.handle('ping', async () => 'pong')
}
