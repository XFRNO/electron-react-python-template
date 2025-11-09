import path from 'path'
import { fileURLToPath } from 'url'

// Dev-safe __dirname
export const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)

/**
 * Resolves a file path relative to the project's root
 */
export function resolveProjectPath(...segments: string[]): string {
  // go back from out/main to project root
  return path.join(__dirname, '../../', ...segments)
}
