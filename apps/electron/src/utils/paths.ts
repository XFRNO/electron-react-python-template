import path from 'path'
import fs from 'fs'

import { IS_DEV } from '@repo/constants'

const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)

/**
 * Resolve a file path relative to the correct base (src in dev, out/main in prod)
 */
export function getAssetPath(...segments: string[]): string {
  if (IS_DEV) {
    return path.join(__dirname, '..', ...segments)
  } else {
    // In production, resourcesPath contains packaged assets
    return path.join(process.resourcesPath, ...segments)
  }
}

export function getPreloadPath(): string {
  const baseDir = __dirname
  const candidates = [
    path.join(baseDir, '../preload/index.js'),
    path.join(baseDir, '../preload/index.mjs'),
    path.join(baseDir, '../preload/index.cjs')
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return candidates[0]
}
