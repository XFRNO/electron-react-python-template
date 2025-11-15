import { BrowserWindow, app } from 'electron'
import path from 'path'
import { getAssetPath } from '../utils/paths.js'

let splashWindow: BrowserWindow | null = null

const preloadPath = path.join(__dirname, '../preload/index.mjs')

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
      preload: preloadPath,
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

  splashWindow.loadFile(getAssetPath('renderer/src/splash.html'))

  splashWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.show()
    }
  })

  splashWindow.on('closed', () => {
    splashWindow = null
  })

  return splashWindow
}

export async function showSplashError(errorMessage: string): Promise<void> {
  if (splashWindow && !splashWindow.isDestroyed()) {
    await splashWindow.webContents.executeJavaScript(`
      window.splashApi.showError("${errorMessage
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')}");
    `)
  }
}

export function closeSplashWindow(): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close()
    splashWindow = null
  }
}

export function getSplashWindow(): BrowserWindow | null {
  return splashWindow
}
