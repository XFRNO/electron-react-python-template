import dotenv from 'dotenv'

import { app, globalShortcut, BrowserWindow, dialog } from 'electron'
import { createSplashWindow, showSplashError } from '../windows/splashWindow'
import { createMainWindow, loadMainWindowContent } from '../windows/mainWindow'
import { checkAndShowMainWindow } from '../windows/windowManager'
import { getMainWindow } from '../windows/mainWindow'
import { frontendManager } from '../lib/frontendManager'
import { backendManager } from '../lib/backendManager'
import { licenseManager } from '../lib/licenseManager'
import { processManager } from '../lib/processManager'
import { setupIpcHandlers } from '../ipc/index'
import setupGlobalShortcuts from '../lib/setupGlobalShortcuts'
import { storeManager } from '../utils/storeManager'
import { Logger } from '../utils/logger'
import { APP_NAME, ISDEV } from '@repo/constants'
import { fileURLToPath } from 'url'
import path from 'path'

// -----------------------------
// Polyfill __filename / __dirname for ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Compute ROOTPATH locally
const ROOTPATH = path.resolve(__dirname, '../../../')

console.log('------------------- electron main.ts -------------------')

console.log('in electron NODE_ENV:', ISDEV)
console.log('in electron LOG_LEVEL:', process.env.ELECTRON_LOG_LEVEL)
console.log('in electron App Name:', APP_NAME)

console.log('------------------- electron main.ts -------------------')

// Constants

// Splash screen flag - set to false to disable splash screen
const SHOW_SPLASH_SCREEN = false

// Global state
let appStartTime: number | null = null
let backendPort: number | undefined = undefined

/**
 * Creates the main application window
 * @returns {Promise<BrowserWindow>} The main window instance
 */
async function createWindow(): Promise<BrowserWindow> {
  Logger.log('Creating main window')

  // Create main window with content loaded callback
  const mainWindow = await createMainWindow(() => {
    // Don't close license window as it might be intentionally shown for license verification
    checkAndShowMainWindow(false)
  }, ISDEV)

  try {
    if (ISDEV) {
      const frontendUrl = await frontendManager.launch(ISDEV, ROOTPATH)
      loadMainWindowContent(frontendUrl, ISDEV)
    } else {
      // Production mode:
      // Load built frontend and start the packaged backend executable.
      const frontendPath = await frontendManager.launch(ISDEV, ROOTPATH)
      loadMainWindowContent(frontendPath, ISDEV)
    }
  } catch (error: unknown) {
    Logger.error('Error setting up application:', error)
    await showSplashError(`Application setup failed: ${(error as Error).message}`)
  }

  return mainWindow
}

/**
 * Main application initialization
 */
app.whenReady().then(async () => {
  appStartTime = Date.now()
  Logger.log('App starting up')

  try {
    // Setup global shortcuts
    setupGlobalShortcuts()

    // Create and show splash window immediately (if enabled)
    if (SHOW_SPLASH_SCREEN) {
      Logger.log('Creating splash window')
      await createSplashWindow()
    }

    // Initialize LicenseManager
    licenseManager.init()

    // Setup IPC handlers
    setupIpcHandlers(createWindow, ISDEV)

    // Start the app launch sequence
    Logger.log('Starting app launch sequence')
    await licenseManager.onAppLaunch(createWindow)

    const frontendPort = frontendManager.getPort()

    const frontendUrl = `http://localhost:${frontendPort}`
    if (frontendManager.IsReady() && !backendManager.IsReady()) {
      backendManager.start(frontendUrl, frontendPort!).catch((err) => {
        Logger.error('Backend startup failed:', err)
      })
    }

    const elapsed = Date.now() - appStartTime
    Logger.log(`App launch sequence completed (took ${elapsed}ms)`)
  } catch (error: unknown) {
    Logger.error('Startup error:', error)

    // Show error in splash window instead of dialog (if enabled)
    if (SHOW_SPLASH_SCREEN) {
      try {
        await showSplashError(`Startup error: ${(error as Error).message}`)
      } catch (splashError: unknown) {
        // Fallback to dialog if splash error fails
        dialog.showErrorBox('Startup error', String(splashError))
        app.quit()
      }
    } else {
      // Directly show error dialog if splash is disabled
      dialog.showErrorBox('Startup error', String(error))
      app.quit()
    }
  }
})

// Handle second instance
app.on('second-instance', () => {
  const mainWindow = getMainWindow()
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

// Handle all windows closed
app.on('window-all-closed', () => {
  const elapsed = Date.now() - (appStartTime || 0)
  Logger.log(`App closing (ran for ${elapsed}ms)`)
  backendManager.stop()
  frontendManager.kill()
  app.quit()
})

// Handle before quit
app.on('before-quit', () => {
  backendManager.stop()
  frontendManager.kill()
  processManager.killAll()

  // Unregister all shortcuts
  globalShortcut.unregisterAll()
})

// Handle process exit
process.on('exit', () => {
  backendManager.stop()
  frontendManager.kill()
  processManager.killAll()
})

// Handle app activation (macOS)
app.on('activate', () => licenseManager.handleAppActivation())

Logger.log('Main process initialized')
