import { BrowserWindow, app } from 'electron'
import path from 'path'
import { getAssetPath, getPreloadPath } from '../utils/paths.js'

let splashWindow: BrowserWindow | null = null

export async function createSplashWindow(): Promise<BrowserWindow> {
  const ROOT = path.join(__dirname, '../../../')

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 400,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
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

  splashWindow = new BrowserWindow(windowOptions)
  await splashWindow.loadFile(getAssetPath('renderer/src/splash.html'))
  return splashWindow
}