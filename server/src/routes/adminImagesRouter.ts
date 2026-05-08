import type { Request, Response } from 'express'

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
    destination: (req, _file, cb) => {
      // Get type from request (POST body should have it)
      // Files are organized by type: /public/common/{type}/
      const commonDir = path.join(__dirname, '../public/common')
      cb(null, commonDir)
    },
    filename: (req, file, cb) => {
      // Get the destination directory to check for collisions
      const commonDir = path.join(__dirname, '../public/common')
      // Sanitize filename and make it unique if needed
      const sanitizedName = sanitizeFilename(file.originalname, commonDir)
      cb(null, sanitizedName)
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
  const allowedTypes = ['icon', 'screen', 'persona']

  // Validate type parameter
  if (!allowedTypes.includes(type)) {
    res.status(400).json({
      error: `Invalid image type. Must be one of: ${allowedTypes.join(', ')}`,
    })
    return
  }

  logger.debug({ type }, 'Admin: list available image files by type')

  try {
    const typeDir = path.normalize(path.join(__dirname, '../public/common', type))
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
    const allowedTypes = ['icon', 'screen', 'persona']

    // Validate type parameter
    if (!allowedTypes.includes(type)) {
      if (req.file) {
        const fs = await import('fs').then((mod) => mod.promises)
        await fs.unlink(req.file.path)
      }
      res.status(400).json({
        error: `Invalid image type. Must be one of: ${allowedTypes.join(', ')}`,
      })
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    logger.debug({ type, filename: req.file.filename }, 'Admin: upload image file')

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

    // Move file to type subdirectory
    try {
      const commonDir = path.normalize(path.join(__dirname, '../public/common'))
      const typeDir = path.normalize(path.join(commonDir, type))
      const finalPath = path.normalize(path.join(typeDir, req.file.filename))

      // Prevent path traversal: ensure the final path is within the type directory
      if (!isPathWithinDirectory(finalPath, typeDir)) {
        const fs = await import('fs').then((mod) => mod.promises)
        await fs.unlink(req.file.path)
        res.status(400).json({ error: 'Invalid filename: path traversal detected' })
        return
      }

      const fs = await import('fs').then((mod) => mod.promises)
      await fs.mkdir(typeDir, { recursive: true })
      await fs.rename(req.file.path, finalPath)

      logger.debug({ type, filename: req.file.filename }, 'File moved to type subdirectory')
    } catch (error) {
      logger.error(error, 'Error organizing file into type subdirectory')
      res.status(500).json({ error: 'Failed to organize file' })
      return
    }

    // Sanitize SVG files server-side
    const fileExtension = path.extname(req.file.filename).toLowerCase()
    if (fileExtension === '.svg') {
      try {
        const typeDir = path.join(__dirname, '../public/common', type)
        const filePath = path.join(typeDir, req.file.filename)
        const content = readFileSync(filePath, 'utf-8')
        const sanitized = sanitizeSVG(content)
        writeFileSync(filePath, sanitized, 'utf-8')
        logger.debug({ filename: req.file.filename }, 'SVG file sanitized')
      } catch (error) {
        logger.error(error, 'Error sanitizing SVG file')
        res.status(500).json({ error: 'Failed to sanitize SVG file' })
        return
      }
    }

    const relativePath = `/public/common/${type}/${req.file.filename}`
    res.status(201).json({
      message: 'Image file uploaded successfully',
      type,
      path: relativePath,
      filename: req.file.filename,
    })
  },
  (error: Error, _req: Request, res: Response) => {
    // Multer error handler
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
  },
)

export default router
