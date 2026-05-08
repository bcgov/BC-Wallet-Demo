import { existsSync } from 'fs'
import path from 'path'

/**
 * Sanitize and make filename unique to prevent collisions and path traversal
 * - Removes/replaces unsafe characters and path separators
 * - Appends timestamp suffix if file already exists
 * @param originalFilename - Original filename from upload
 * @param uploadDir - Directory where file will be saved
 * @returns Sanitized, collision-free filename
 */
export function sanitizeFilename(originalFilename: string, uploadDir: string): string {
  // Remove any path separators (prevent path traversal like ../../../etc/passwd)
  let sanitized = originalFilename.replace(/[/\\]/g, '_')

  // Sanitize: keep only alphanumeric, dots, hyphens, and underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_')

  // Remove leading/trailing dots, underscores, and hyphens
  sanitized = sanitized.replace(/^[._-]+|[._-]+$/g, '')

  // Prevent double dots (potential directory traversal)
  sanitized = sanitized.replace(/\.{2,}/g, '.')

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
