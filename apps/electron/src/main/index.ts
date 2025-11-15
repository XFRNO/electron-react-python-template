import path from 'path'
import dotenv from 'dotenv'
import { app, BrowserWindow, ipcMain } from 'electron'
import { Logger } from '../utils/logger.js'
import { IS_DEV } from '@repo/constants'
import { createSplashWindow } from '../windows/splashWindow.js'
import { createLicenseWindow } from '../windows/licenseWindow.js'
import { createMainWindow } from '../windows/mainWindow.js'
import { setupIpcHandlers } from '../ipc/index.js'
import { frontendManager } from '../lib/frontendManager.js'
import { backendManager } from '../lib/backendManager.js'
import { licenseManager } from '../lib/licenseManager.js'
import { processManager } from '../lib/processManager.js'
import { storeManager } from '../utils/storeManager.js'

const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

let appStartTime: number | null = null

async function appStartup(): Promise<void> {
  appStartTime = Date.now()
  const splash = await createSplashWindow()
  splash.show()

  const license = storeManager.getLicense()
  Logger.log('License:', license)

  setupIpcHandlers()

  licenseManager.init()

  const isLicensed = await licenseManager.isLicensed()

  if (!isLicensed) {
    Logger.log('License not found, opening license window')
    const lic = await createLicenseWindow()
    lic.show()

    if (splash && !splash.isDestroyed()) splash.close()

    const verified = await new Promise<boolean>((resolve) => {
      ipcMain.once('license:verified', () => resolve(true))
      lic.on('closed', () => resolve(false))
    })

    if (lic && !lic.isDestroyed()) lic.close()

    if (!verified) {
      app.quit()
      return
    }
  }

  const urlOrPath = await frontendManager.launch()
  await backendManager.start(urlOrPath)

  const mainWindow = await createMainWindow()
  if (IS_DEV) {
    mainWindow.loadURL(urlOrPath)
  } else {
    mainWindow.loadFile(urlOrPath)
  }

  if (splash && !splash.isDestroyed()) splash.close()

  mainWindow.show()
  Logger.log(`App startup completed in ${Date.now() - (appStartTime || Date.now())}ms`)
}

app.whenReady().then(appStartup)

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

app.on('second-instance', () => {
  const wins = BrowserWindow.getAllWindows()
  const main = wins.find((w) => !w.isDestroyed())
  if (main) {
    if (main.isMinimized()) main.restore()
    main.focus()
  }
})

app.on('window-all-closed', () => {
  backendManager.kill()
  frontendManager.stop()
  app.quit()
})

app.on('before-quit', () => {
  backendManager.kill()
  frontendManager.stop()
  processManager.killAll()
})

process.on('exit', () => {
  backendManager.kill()
  frontendManager.stop()
  processManager.killAll()
})

Logger.log('Main process initialized')
