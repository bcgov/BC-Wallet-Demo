import type { Request, Response } from 'express'

import { randomUUID } from 'crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import multer from 'multer'
import path from 'path'

import { requireRole } from '../middleware/requireAdmin'
import logger from '../utils/logger'
import { sanitizeFilename } from '../utils/sanitizeFilename'
import { sanitizeSVG } from '../utils/sanitizeSVG'
import { validateFileType } from '../utils/validateFileType'

const router = Router()

/**
 * Allowed image types with their directory names
 * Using a static mapping prevents path traversal and satisfies CodeQL path validation
 */
const ALLOWED_IMAGE_TYPES = {
  icon: 'icon',
  screen: 'screen',
  persona: 'persona',
} as const

type ImageType = keyof typeof ALLOWED_IMAGE_TYPES

/**
 * Helper to validate and get allowed image type
 * Returns the validated type or null if invalid
 */
function getValidatedImageType(type: string | undefined): ImageType | null {
  if (!type || !Object.hasOwn(ALLOWED_IMAGE_TYPES, type)) {
    return null
  }
  return type as ImageType
}

/**
 * Rate limiting for image listing (GET)
 * Allow 30 requests per 15 minutes per IP
 */
const getImagesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'Too many image listing requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiting for image uploads (POST)
 * Allow 10 requests per 15 minutes per IP (more restrictive due to file I/O)
 */
const uploadImageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many upload requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Configure multer for image file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      // Validate type parameter in multer callback to ensure proper directory handling
      const type = req.params.type
      const validatedType = getValidatedImageType(type)

      if (!validatedType) {
        cb(new Error('Invalid image type'), '')
        return
      }

      // Store validated type on request for use in filename callback
      ;(req as any).__validatedType = validatedType

      // Save directly to type subdirectory to avoid race conditions
      const typeDir = path.normalize(path.join(__dirname, '../public/common', ALLOWED_IMAGE_TYPES[validatedType]))
      cb(null, typeDir)
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      // Get the validated type and destination directory
      const validatedType = (req as any).__validatedType as ImageType | undefined
      if (!validatedType) {
        cb(new Error('Invalid image type'), file.originalname)
        return
      }

      const typeDir = path.normalize(path.join(__dirname, '../public/common', ALLOWED_IMAGE_TYPES[validatedType]))

      // Sanitize filename and check for collisions in the actual destination directory
      const baseFilename = sanitizeFilename(file.originalname, typeDir)

      // Generate a UUID prefix to ensure uniqueness and avoid race conditions
      // Format: {uuid}_{baseFilename}
      const uuid = randomUUID().split('-')[0] // Use first 8 chars of UUID for brevity
      const ext = path.extname(baseFilename)
      const nameWithoutExt = baseFilename.slice(0, -ext.length)
      const filename = `${uuid}_${nameWithoutExt}${ext}`

      cb(null, filename)
    },
  }),
  fileFilter: (_req, file, cb) => {
    // Allow image files: SVG, PNG, JPG, JPEG, GIF, WEBP
    const allowedExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp']
    const fileExtension = path.extname(file.originalname).toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      cb(new Error('Only image files (SVG, PNG, JPG, JPEG, GIF, WEBP) are allowed'))
      return
    }
    cb(null, true)
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

/**
 * Validate that a resolved path is within an allowed directory
 * Prevents path traversal attacks
 */
function isPathWithinDirectory(filePath: string, allowedDir: string): boolean {
  const normalizedPath = path.normalize(filePath)
  const normalizedDir = path.normalize(allowedDir)
  return normalizedPath.startsWith(normalizedDir + path.sep) || normalizedPath === normalizedDir
}

/**
 * GET /admin/images/:type
 * List all available image files in a specific subdirectory.
 * Type must be one of: icon, screen, persona
 * Requires: admin or creator or viewer role
 */
router.get('/:type', getImagesLimiter, requireRole(['admin', 'creator', 'viewer']), (req: Request, res: Response) => {
  const { type } = req.params

  // Validate type parameter using static whitelist (satisfies CodeQL path validation)
  const validatedType = getValidatedImageType(type)
  if (!validatedType) {
    const allowedTypes = Object.keys(ALLOWED_IMAGE_TYPES)
    res.status(415).json({
      warning: `Invalid image type '${type}'.`,
      supportTypes: allowedTypes,
    })
    return
  }

  logger.debug({ type: validatedType }, 'Admin: list available image files by type')

  try {
    const typeDir = path.normalize(path.join(__dirname, '../public/common', ALLOWED_IMAGE_TYPES[validatedType]))
    const files = readdirSync(typeDir)

    // Filter for image files
    const allowedExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp']
    const availableImages = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase()
        return allowedExtensions.includes(ext)
      })
      .filter((file) => {
        // Ensure the file path is within the type directory (prevent path traversal)
        const fullPath = path.normalize(path.join(typeDir, file))
        return isPathWithinDirectory(fullPath, typeDir)
      })
      .map((file) => `/public/common/${type}/${file}`)

    res.json({ type, files: availableImages })
  } catch (error) {
    logger.error(error, 'Error reading images directory')
    res.status(500).json({ error: 'Failed to read images directory' })
  }
})

/**
 * POST /admin/images/:type
 * Upload a new image file to the type-specific subdirectory.
 * Type must be one of: icon, screen, persona
 * SVG files are sanitized server-side to remove potentially dangerous content.
 * Requires: admin or creator role
 */
router.post(
  '/:type',
  uploadImageLimiter,
  requireRole(['admin', 'creator']),
  upload.single('file'),
  async (req: Request, res: Response) => {
    const { type } = req.params

    // Validate type parameter using static whitelist (satisfies CodeQL path validation)
    const validatedType = getValidatedImageType(type)
    if (!validatedType) {
      if (req.file) {
        const fs = await import('fs').then((mod) => mod.promises)
        await fs.unlink(req.file.path)
      }
      const allowedTypes = Object.keys(ALLOWED_IMAGE_TYPES)
      res.status(415).json({
        warning: `Invalid image type '${type}'.`,
        supportTypes: allowedTypes,
      })
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    logger.debug({ type: validatedType, filename: req.file.filename }, 'Admin: upload image file')

    // Validate file type by magic bytes (actual file content)
    try {
      const fileBuffer = readFileSync(req.file.path)
      const isValidType = await validateFileType(fileBuffer, req.file.filename)

      if (!isValidType) {
        // Delete the file if validation fails
        const fs = await import('fs').then((mod) => mod.promises)
        await fs.unlink(req.file.path)
        res.status(400).json({ error: 'File type validation failed. Please upload a valid image file.' })
        return
      }
    } catch (error) {
      logger.error(error, 'Error validating file type')
      res.status(500).json({ error: 'Failed to validate file type' })
      return
    }

    // File is already in the correct type subdirectory thanks to multer configuration
    // Ensure directory exists (in case of concurrent operations)
    try {
      const typeDir = path.normalize(path.join(__dirname, '../public/common', ALLOWED_IMAGE_TYPES[validatedType]))
      const fs = await import('fs').then((mod) => mod.promises)
      await fs.mkdir(typeDir, { recursive: true })
    } catch (error) {
      logger.error(error, 'Error ensuring type directory exists')
      // Clean up the uploaded file since the operation failed
      try {
        const fs = await import('fs').then((mod) => mod.promises)
        await fs.unlink(req.file.path)
      } catch (cleanupError) {
        logger.error(cleanupError, 'Error cleaning up uploaded file after directory creation failure')
      }
      res.status(500).json({ error: 'Failed to ensure upload directory exists' })
      return
    }

    // Sanitize SVG files server-side
    const fileExtension = path.extname(req.file.filename).toLowerCase()
    if (fileExtension === '.svg') {
      try {
        const typeDir = path.join(__dirname, '../public/common', ALLOWED_IMAGE_TYPES[validatedType])
        const filePath = path.join(typeDir, req.file.filename)
        const content = readFileSync(filePath, 'utf-8')
        const sanitized = sanitizeSVG(content)
        writeFileSync(filePath, sanitized, 'utf-8')
        logger.debug({ filename: req.file.filename }, 'SVG file sanitized')
      } catch (error) {
        logger.error(error, 'Error sanitizing SVG file')
        // Clean up the uploaded file since sanitization failed
        try {
          const fs = await import('fs').then((mod) => mod.promises)
          await fs.unlink(req.file.path)
        } catch (cleanupError) {
          logger.error(cleanupError, 'Error cleaning up uploaded file after SVG sanitization failure')
        }
        res.status(500).json({ error: 'Failed to sanitize SVG file' })
        return
      }
    }

    const relativePath = `/public/common/${ALLOWED_IMAGE_TYPES[validatedType]}/${req.file.filename}`
    res.status(201).json({
      message: 'Image file uploaded successfully',
      type: validatedType,
      path: relativePath,
      filename: req.file.filename,
    })
  },
)

/**
 * Multer error handler for file upload errors
 * Must be placed after all route handlers to catch multer errors
 */
router.use((error: Error, _req: Request, res: Response) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File size must be less than 5MB' })
      return
    }
  }

  if (error.message.includes('only image files')) {
    res.status(400).json({ error: error.message })
    return
  }

  logger.error(error, 'File upload error')
  res.status(500).json({ error: 'File upload failed' })
})

export default router
