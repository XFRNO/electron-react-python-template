import { BrowserWindow } from 'electron'
import path from 'path'
import { Logger } from '../utils/logger.js'

import { APP_NAME, IS_DEV } from '@repo/constants'

let mainWindow: BrowserWindow | null = null
let isRefreshing = false
let contentLoadTimeout: NodeJS.Timeout | null = null

const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)

const ROOTPATH = path.resolve(__dirname, '../../../')

const preloadPath = path.join(__dirname, '../preload/index.mjs')

export async function createMainWindow(onContentLoaded: () => void): Promise<BrowserWindow> {
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    title: APP_NAME,
    width: 800,
    height: 1000,
    show: false,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false
    }
  }

  if (IS_DEV) {
    const platform = process.platform
    let iconPath: string | null = null

    if (platform === 'darwin') {
      iconPath = path.join(ROOTPATH, 'assets/icon.icns')
    } else if (platform === 'win32') {
      iconPath = path.join(ROOTPATH, 'assets/icon.ico')
    } else {
      iconPath = path.join(ROOTPATH, 'assets/icon.png')
    }

    windowOptions.icon = iconPath
  }

  mainWindow = new BrowserWindow(windowOptions)

  setupMainWindowEvents(onContentLoaded)

  mainWindow.on('closed', () => {
    mainWindow = null
    if (contentLoadTimeout) {
      clearTimeout(contentLoadTimeout)
      contentLoadTimeout = null
    }
  })

  mainWindow.webContents.on('did-fail-load', (errorCode, errorDescription) => {
    Logger.error(`Main window failed to load: ${errorCode} - ${errorDescription}`)
  })

  mainWindow.webContents.on('render-process-gone', (details) => {
    Logger.error(`Main window render process gone: ${JSON.stringify(details)}`)
  })

  return mainWindow
}

function setupMainWindowEvents(onContentLoaded: () => void): void {
  if (!mainWindow) return

  // Prevents the window from navigating to the same URL, which can cause infinite loading loops
  mainWindow.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    const currentURL = mainWindow!.webContents.getURL()
    if (currentURL && url === currentURL) {
      isRefreshing = true
    }
  })

  if (!IS_DEV) {
    contentLoadTimeout = setTimeout(() => {
      if (!isRefreshing && mainWindow && !mainWindow.isDestroyed()) {
        if (onContentLoaded) {
          onContentLoaded()
        }
      }
    }, 100)
  }

  mainWindow.webContents.on('did-finish-load', () => {
    if (contentLoadTimeout) {
      clearTimeout(contentLoadTimeout)
      contentLoadTimeout = null
    }

    if (isRefreshing) {
      isRefreshing = false
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show()
        mainWindow.focus()
      }
    } else {
      if (onContentLoaded) {
        onContentLoaded()
      }
    }
  })

  if (IS_DEV) {
    contentLoadTimeout = setTimeout(() => {
      if (!isRefreshing && mainWindow && !mainWindow.isDestroyed()) {
        Logger.warn('Content loading timeout (dev mode) - showing window anyway')
        if (onContentLoaded) {
          onContentLoaded()
        }
      }
    }, 5000)
  }
}

export function loadMainWindowContent(urlOrPath: string): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (IS_DEV) {
      mainWindow.loadURL(urlOrPath)
    } else {
      mainWindow.loadFile(urlOrPath)
    }
  }
}

export function showMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show()
    mainWindow.focus()
  }
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function isMainWindowReady(): boolean {
  return mainWindow !== null && !mainWindow.isDestroyed() && !isRefreshing
}

export function resetRefreshState(): void {
  isRefreshing = false
}
