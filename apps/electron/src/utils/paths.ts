import path from 'path'

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
