import { BrowserWindow, app } from 'electron'
import path from 'path'
import { getAssetPath, getPreloadPath } from '../utils/paths.js'

let licenseWindow: BrowserWindow | null = null

export async function createLicenseWindow(): Promise<BrowserWindow> {
  if (licenseWindow) {
    if (!licenseWindow.isDestroyed()) licenseWindow.close()
    licenseWindow = null
  }

  const ROOT = path.join(__dirname, '../../../')

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 500,
    height: 500,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      contextIsolation: true,
      preload: getPreloadPath(),
      nodeIntegration: false,
      webSecurity: true
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

  licenseWindow = new BrowserWindow(windowOptions)
  await licenseWindow.loadFile(getAssetPath('renderer/src/license.html'))
  return licenseWindow
}