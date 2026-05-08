import { existsSync } from 'fs'
import path from 'path'

/**
 * Sanitize and make filename unique to prevent collisions
 * - Removes/replaces unsafe characters
 * - Appends timestamp suffix if file already exists
 * @param originalFilename - Original filename from upload
 * @param uploadDir - Directory where file will be saved
 * @returns Sanitized, collision-free filename
 */
export function sanitizeFilename(originalFilename: string, uploadDir: string): string {
  // Sanitize: keep only alphanumeric, dots, hyphens, and underscores
  let sanitized = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_')

  // Remove leading/trailing dots and underscores
  sanitized = sanitized.replace(/^[._-]+|[._-]+$/g, '')

  // Ensure we still have a filename
  if (!sanitized) {
    sanitized = 'file'
  }

  // Check for collision and append timestamp if needed
  const fullPath = path.join(uploadDir, sanitized)
  if (existsSync(fullPath)) {
    const ext = path.extname(sanitized)
    const nameWithoutExt = sanitized.slice(0, -ext.length)
    const timestamp = Date.now()
    sanitized = `${nameWithoutExt}_${timestamp}${ext}`
  }

  return sanitized
}
