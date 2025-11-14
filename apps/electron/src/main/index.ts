import dotenv from 'dotenv'
import { app, globalShortcut, BrowserWindow, dialog } from 'electron'
import { createSplashWindow, showSplashError } from '../windows/splashWindow'
import { createMainWindow, loadMainWindowContent } from '../windows/mainWindow'
import { getMainWindow } from '../windows/mainWindow'
import { frontendManager } from '../lib/frontendManager'
import { backendManager } from '../lib/backendManager'
import { licenseManager } from '../lib/licenseManager'
import { processManager } from '../lib/processManager'
import { setupIpcHandlers } from '../ipc/index'
import setupGlobalShortcuts from '../lib/setupGlobalShortcuts'
import { Logger } from '../utils/logger'
import {
  IS_SHOW_SPLASH_SCREEN,
  IS_DEV,
  ENABLE_LICENSE_GRACE_PERIOD,
  LICENSE_GRACE_PERIOD_DAYS
} from '@repo/constants'

import path from 'path'

const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

let appStartTime: number | null = null

/**
 * Creates the main application window
 * @returns {Promise<BrowserWindow>} The main window instance
 */
async function createWindow(): Promise<BrowserWindow> {
  Logger.log('Creating main window')

  // Create main window with content loaded callback
  const mainWindow = await createMainWindow(() => {})

  // Launch frontend server and start the backend process.
  try {
    // Development mode:
    if (IS_DEV) {
      const frontendUrl = await frontendManager.launch()
      loadMainWindowContent(frontendUrl)
    } else {
      // Production mode:
      // Load built frontend and start the packaged backend executable.
      const frontendPath = await frontendManager.launch()
      loadMainWindowContent(frontendPath)
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
    if (IS_SHOW_SPLASH_SCREEN) {
      Logger.log('Creating splash window')
      await createSplashWindow()
    }

    // Setup IPC handlers
    setupIpcHandlers(createWindow)

    // Initialize LicenseManager
    licenseManager.init()
    // Configure grace period from constants (supports runtime env overrides)
    licenseManager.setGracePeriodConfig({
      enabled: ENABLE_LICENSE_GRACE_PERIOD,
      days: LICENSE_GRACE_PERIOD_DAYS
    })

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
    if (IS_SHOW_SPLASH_SCREEN) {
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
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

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
  backendManager.kill()
  frontendManager.stop()
  app.quit()
})

// Handle before quit
app.on('before-quit', () => {
  backendManager.kill()
  frontendManager.stop()
  processManager.killAll()

  // Unregister all shortcuts
  globalShortcut.unregisterAll()
})

// Handle process exit
process.on('exit', () => {
  backendManager.kill()
  frontendManager.stop()
  processManager.killAll()
})

// Handle app activation (macOS)
app.on('activate', () => licenseManager.handleAppActivation())

Logger.log('Main process initialized')
