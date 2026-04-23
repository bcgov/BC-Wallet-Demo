import type { Request, Response } from 'express'

import { Router } from 'express'
import multer from 'multer'
import path from 'path'

import { requireRole } from '../middleware/requireAdmin'
import logger from '../utils/logger'

const router = Router()

// Configure multer for SVG file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const publicDir = path.join(__dirname, '../public')
      cb(null, publicDir)
    },
    filename: (_req, file, cb) => {
      // Sanitize filename
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
      cb(null, sanitizedName)
    },
  }),
  fileFilter: (_req, file, cb) => {
    // Only allow SVG files
    if (!file.originalname.endsWith('.svg')) {
      cb(new Error('Only SVG files are allowed'))
      return
    }
    cb(null, true)
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

/**
 * GET /admin/svgs
 * List all available SVG files in the public directory.
 * Requires: admin or creator or viewer role
 */
router.get('/', requireRole(['admin', 'creator', 'viewer']), (_req: Request, res: Response) => {
  logger.debug('Admin: list available SVG files')

  // Return a curated list of available SVG files
  const availableSvgs = [
    '/public/businesswoman/businesswoman.svg',
    '/public/lawyer2/icon-lawyer2.svg',
    '/public/lawyer2/lawyer2.svg',
    '/public/student/student.svg',
  ]

  res.json({ files: availableSvgs })
})

/**
 * POST /admin/svgs
 * Upload a new SVG file to the public directory.
 * Requires: admin or creator role
 */
router.post(
  '/',
  requireRole(['admin', 'creator']),
  upload.single('file'),
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    logger.debug({ filename: req.file.filename }, 'Admin: upload SVG file')

    const relativePath = `/public/${req.file.filename}`
    res.status(201).json({
      message: 'SVG file uploaded successfully',
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

    if (error.message === 'Only SVG files are allowed') {
      res.status(400).json({ error: 'Only SVG files are allowed' })
      return
    }

    logger.error(error, 'File upload error')
    res.status(500).json({ error: 'File upload failed' })
  },
)

export default router
