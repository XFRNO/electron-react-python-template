import path from 'path'
import fs from 'fs'
import { Logger } from '../utils/logger.js'
import { waitForResource } from '../utils/waitOnResource.js'
import { processManager } from './processManager.js'
import { getAvailablePort } from '../utils/portUtils.js'
import { IS_DEV } from '@repo/constants'


const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)

const ROOTPATH = path.resolve(__dirname, '../../../')

class FrontendManager {
  private port: number | null = null
  private processId: string | null = null
  private isReady: boolean = false

  /**
   * Launch frontend in dev or prod mode
   */
  public async launch(): Promise<string> {
    const startTime = Date.now()
    Logger.log(`🚀 Launching frontend (${IS_DEV ? 'dev' : 'prod'})`)

    const frontendDir = IS_DEV
      ? path.join(ROOTPATH, '/apps/frontend')
      : path.join(process.resourcesPath, 'frontend')

    // ---- Development mode ----
    if (IS_DEV) {
      const frontendPort = await getAvailablePort()
      const url = `http://localhost:${frontendPort}`
      this.port = frontendPort
      const processName = 'frontend-dev-server'

      // Spawn Vite dev server
      Logger.log(`Starting Vite dev server on port ${frontendPort}...`)
      processManager.spawn(processName, 'pnpm', ['run', 'dev'], {
        cwd: frontendDir,
        env: { ...process.env, PORT: frontendPort.toString() }
      })

      this.processId = processName // Store process ID for later termination

      try {
        await waitForResource({ resource: url })

        this.isReady = true

        Logger.log(`✅ Frontend dev server running at ${url} (took ${Date.now() - startTime}ms)`)
        return url
      } catch (err) {
        Logger.error(`❌ Frontend dev server not reachable at ${url}: ${(err as Error).message}`)
        this.stop()
        throw err
      }
    }

    // ---- Production mode ----
    const prodIndex = path.join(frontendDir, 'index.html')
    if (!fs.existsSync(prodIndex)) {
      throw new Error(`❌ Production frontend not found at ${prodIndex}`)
    }

    Logger.log(`✅ Using local production build (${Date.now() - startTime}ms)`)
    this.isReady = true
    return prodIndex
  }

  /**
   * Cleanly stops the frontend dev server
   */
  public stop(): void {
    // Use the processManager to kill the frontend dev server by its registered name.
    if (this.processId) {
      processManager.kill(this.processId)
      this.processId = null // Clear the reference after termination
    }
  }

  public getPort(): number | null {
    return this.port
  }

  public IsReady(): boolean {
    return this.isReady
  }
}

export const frontendManager = new FrontendManager()
