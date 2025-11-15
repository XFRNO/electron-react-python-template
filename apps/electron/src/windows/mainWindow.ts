import { BrowserWindow, app } from 'electron'
import path from 'path'
import { APP_NAME } from '@repo/constants'
import { getPreloadPath } from '../utils/paths.js'

let mainWindow: BrowserWindow | null = null

export async function createMainWindow(): Promise<BrowserWindow> {
  const ROOT = path.join(__dirname, '../../../')

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    title: APP_NAME,
    width: 1024,
    height: 768,
    show: false,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      contextIsolation: true,
      preload: getPreloadPath(),
      webSecurity: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false
    }
  }

  if (!app.isPackaged) {
    const platform = process.platform
    let iconPath
    if (platform === 'darwin') {
      iconPath = path.join(ROOT, 'assets/icon.icns')
    } else if (platform === 'win32') {
      iconPath = path.join(ROOT, 'assets/icon.ico')
    } else {
      iconPath = path.join(ROOT, 'assets/icon.png')
    }
    windowOptions.icon = iconPath
  }

  mainWindow = new BrowserWindow(windowOptions)
  return mainWindow
}
