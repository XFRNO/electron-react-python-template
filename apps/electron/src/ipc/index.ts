import { ipcMain } from 'electron'
import { setupApiHandlers } from './api.js'
import { setupSystemHandlers } from './system.js'
import { setupSettingsHandlers } from './settings.js'

export function setupIpcHandlers(): void {
  setupApiHandlers()
  setupSystemHandlers()
  setupSettingsHandlers()
  ipcMain.handle('ping', async () => 'pong')
}
