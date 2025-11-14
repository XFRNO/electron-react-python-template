import { BrowserWindow } from 'electron'
import path from 'path'
import { Logger } from '../utils/logger.js'
import { getAssetPath } from '../utils/paths.js'

import { IS_DEV } from '@repo/constants'
let licenseWindow: BrowserWindow | null = null

export const __filename = new URL(import.meta.url).pathname
export const __dirname = path.dirname(__filename)

export async function createLicenseWindow(): Promise<BrowserWindow> {
  if (licenseWindow) {
    licenseWindow.close()
    licenseWindow = null
  }

  const preloadPath = path.join(__dirname, '../preload/index.cjs')

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 500,
    height: 500,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    show: true,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
      nodeIntegration: false
    }
  }

  if (IS_DEV) {
    const platform = process.platform
    let iconPath

    if (platform === 'darwin') {
      iconPath = path.join(__dirname, 'assets/icon.icns')
    } else if (platform === 'win32') {
      iconPath = path.join(__dirname, 'assets/icon.ico')
    } else {
      iconPath = path.join(__dirname, 'assets/icon.png')
    }

    windowOptions.icon = iconPath
  }

  licenseWindow = new BrowserWindow(windowOptions)

  const licenseHtmlPath = getAssetPath('renderer/src/license.html')

  await licenseWindow.loadFile(licenseHtmlPath)

  licenseWindow.once('ready-to-show', () => {
    if (licenseWindow && !licenseWindow.isDestroyed()) {
      licenseWindow.show()
    }
  })

  licenseWindow.on('closed', () => {
    licenseWindow = null
  })

  licenseWindow.webContents.on('did-fail-load', (errorCode, errorDescription) => {
    Logger.error(`License window failed to load: ${errorCode} - ${errorDescription}`)
  })

  licenseWindow.webContents.on('render-process-gone', (details) => {
    Logger.error(`License window render process gone: ${JSON.stringify(details)}`)
  })

  return licenseWindow
}

export function closeLicenseWindow(): void {
  if (licenseWindow && !licenseWindow.isDestroyed()) {
    licenseWindow.close()
    licenseWindow = null
  }
}

export function getLicenseWindow(): BrowserWindow | null {
  return licenseWindow
}
