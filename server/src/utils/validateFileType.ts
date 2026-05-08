/**
 * Allowed MIME types for image uploads
 */
const ALLOWED_MIME_TYPES = new Set(['image/svg+xml', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'])

/**
 * Validate file by magic bytes (actual file content) rather than just extension
 * This prevents mislabeled files and catches malicious executables with fake extensions
 * @param buffer - File buffer to validate
 * @param filename - Original filename (used for fallback if detection fails)
 * @returns true if file is valid image type, false otherwise
 */
export async function validateFileType(buffer: Buffer, filename: string): Promise<boolean> {
  // CommonJs dynamic import to avoid loading 'file-type' module unnecessarily (only for uploads)
  const fileTypeModule = await Function('return import("file-type")')()
  const { fileTypeFromBuffer } = fileTypeModule
  try {
    const fileType = await fileTypeFromBuffer(buffer)

    // If file-type detected a MIME type, validate it
    if (fileType) {
      return ALLOWED_MIME_TYPES.has(fileType.mime)
    }

    // Fallback: if no MIME type detected, allow SVG files (they're XML and may not have magic bytes)
    // by checking extension
    const extension = filename.split('.').pop()?.toLowerCase()
    return extension === 'svg'
  } catch {
    // On error, reject the file (fail secure)
    return false
  }
}
