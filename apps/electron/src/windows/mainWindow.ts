import { BrowserWindow, app, shell } from 'electron'
import path from 'path'
import { Logger } from '../utils/logger.js'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let isRefreshing = false
let contentLoadTimeout: NodeJS.Timeout | null = null

// import { ROOTPATH } from '@repo/constants' // Constants

// export async function createMainWindow(
//   onContentLoaded: () => void,
//   isDev: boolean // Add isDev as an argument
// ): Promise<BrowserWindow> {
//   const windowOptions: Electron.BrowserWindowConstructorOptions = {
//     title: 'Video Downloader',
//     width: 800,
//     height: 1000,
//     show: false,
//     backgroundColor: '#1a1a1a',
//     webPreferences: {
//       contextIsolation: true,
//       preload: path.join(ROOTPATH, 'electron/src/preload.ts'),
//       webSecurity: true,
//       nodeIntegration: false,
//       sandbox: false,
//       spellcheck: false
//     }
//   }

//   if (isDev) {
//     const platform = process.platform
//     let iconPath

//     if (platform === 'darwin') {
//       iconPath = path.join(ROOTPATH, 'assets/icon.icns')
//     } else if (platform === 'win32') {
//       iconPath = path.join(ROOTPATH, 'assets/icon.ico')
//     } else {
//       iconPath = path.join(ROOTPATH, 'assets/icon.png')
//     }

//     windowOptions.icon = iconPath
//   }

//   mainWindow = new BrowserWindow(windowOptions)

//   setupMainWindowEvents(onContentLoaded, isDev) // Pass isDev to setupMainWindowEvents

//   mainWindow.on('closed', () => {
//     mainWindow = null
//     if (contentLoadTimeout) {
//       clearTimeout(contentLoadTimeout)
//       contentLoadTimeout = null
//     }
//   })

//   mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
//     Logger.error(`Main window failed to load: ${errorCode} - ${errorDescription}`)
//   })

//   mainWindow.webContents.on('render-process-gone', (event, details) => {
//     Logger.error(`Main window render process gone: ${JSON.stringify(details)}`)
//   })

//   return mainWindow
// }

export async function createMainWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupMainWindowEvents(onContentLoaded: () => void, isDev: boolean): void {
  // Add isDev as an argument
  if (!mainWindow) return

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentURL = mainWindow!.webContents.getURL()
    if (currentURL && url === currentURL) {
      isRefreshing = true
    }
  })

  if (!isDev) {
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

  if (isDev) {
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

export function loadMainWindowContent(urlOrPath: string, isDev: boolean): void {
  // Add isDev as an argument
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (isDev) {
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
