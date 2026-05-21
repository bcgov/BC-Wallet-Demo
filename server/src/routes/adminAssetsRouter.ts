import type { NextFunction, Request, Response } from 'express'

import { randomUUID } from 'crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import mongoose from 'mongoose'
import multer from 'multer'
import fs from 'node:fs/promises'
import path from 'path'

import { AssetModel } from '../db/models/Asset'
import { ShowcaseModel } from '../db/models/Showcase'
import { requireRole } from '../middleware/requireAdmin'
import logger from '../utils/logger'
import { sanitizeFilename } from '../utils/sanitizeFilename'
import { sanitizeSVG } from '../utils/sanitizeSVG'
import { validateFileType } from '../utils/validateFileType'

export const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(process.cwd(), 'uploads')

const ALLOWED_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const EXT_TO_MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

const router = Router()

const getLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many upload requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

const deleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many delete requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Validate :showcaseId param: must be a valid ObjectId that exists in the DB.
 * Runs before multer so we never write a file for a nonexistent showcase.
 */
async function validateShowcase(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { showcaseId } = req.params
  if (!mongoose.Types.ObjectId.isValid(showcaseId)) {
    res.status(400).json({ error: 'Invalid showcase ID format' })
    return
  }
  const exists = await ShowcaseModel.exists({ _id: showcaseId })
  if (!exists) {
    res.status(404).json({ error: 'Showcase not found' })
    return
  }
  next()
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req: Request, _file: Express.Multer.File, cb: (err: Error | null, dest: string) => void) => {
      const { showcaseId } = req.params
      const showcaseDir = path.join(UPLOADS_DIR, showcaseId)
      try {
        mkdirSync(showcaseDir, { recursive: true })
        cb(null, showcaseDir)
      } catch (err) {
        cb(err as Error, '')
      }
    },
    filename: (req: Request, file: Express.Multer.File, cb: (err: Error | null, filename: string) => void) => {
      const { showcaseId } = req.params
      const showcaseDir = path.join(UPLOADS_DIR, showcaseId)
      const baseFilename = sanitizeFilename(file.originalname, showcaseDir)
      const uuid = randomUUID().split('-')[0]
      const ext = path.extname(baseFilename)
      const nameWithoutExt = ext ? baseFilename.slice(0, -ext.length) : baseFilename
      cb(null, `${uuid}_${nameWithoutExt}${ext}`)
    },
  }),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      cb(new Error(`Only image files (${ALLOWED_EXTENSIONS.join(', ')}) are allowed`))
      return
    }
    cb(null, true)
  },
  limits: { fileSize: MAX_FILE_SIZE },
})

/**
 * POST /admin/assets/:showcaseId
 * Upload an image asset for a showcase.
 * Stored at UPLOADS_DIR/{showcaseId}/{uuid}_{filename}.
 */
router.post(
  '/:showcaseId',
  uploadLimiter,
  requireRole(['admin', 'creator']),
  validateShowcase,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    const { showcaseId } = req.params

    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    logger.debug({ showcaseId, filename: req.file.filename }, 'Admin: upload asset')

    // Validate file content by magic bytes
    try {
      const fileBuffer = readFileSync(req.file.path)
      const isValid = await validateFileType(fileBuffer, req.file.filename)
      if (!isValid) {
        await fs.unlink(req.file.path).catch(() => {})
        res.status(400).json({ error: 'File type validation failed. Upload a valid image file.' })
        return
      }
    } catch (err) {
      logger.error(err, 'Error validating file type')
      await fs.unlink(req.file.path).catch(() => {})
      res.status(500).json({ error: 'Failed to validate file type' })
      return
    }

    // Sanitize SVG content to strip dangerous markup
    const ext = path.extname(req.file.filename).toLowerCase()
    if (ext === '.svg') {
      try {
        const content = readFileSync(req.file.path, 'utf-8')
        const sanitized = sanitizeSVG(content)
        writeFileSync(req.file.path, sanitized, 'utf-8')
      } catch (err) {
        logger.error(err, 'Error sanitizing SVG')
        await fs.unlink(req.file.path).catch(() => {})
        res.status(500).json({ error: 'Failed to sanitize SVG file' })
        return
      }
    }

    const mimeType = EXT_TO_MIME[ext] ?? 'application/octet-stream'

    try {
      const asset = await AssetModel.create({
        showcase_id: showcaseId,
        filename: req.file.filename,
        path: req.file.path,
        mime_type: mimeType,
        size_bytes: req.file.size,
      })

      const json = asset.toJSON() as unknown as Record<string, unknown>
      res.status(201).json({
        id: json['id'],
        filename: json['filename'],
        mime_type: json['mime_type'],
        size_bytes: json['size_bytes'],
        url: `/uploads/${showcaseId}/${req.file.filename}`,
        created_at: json['createdAt'],
      })
    } catch (err) {
      logger.error(err, 'Error creating asset record')
      await fs.unlink(req.file.path).catch(() => {})
      res.status(500).json({ error: 'Failed to save asset record' })
    }
  },
)

/**
 * GET /admin/assets/:showcaseId
 * List all assets for a showcase, returning metadata + URL for each.
 */
router.get(
  '/:showcaseId',
  getLimiter,
  requireRole(['admin', 'creator', 'viewer']),
  validateShowcase,
  async (req: Request, res: Response): Promise<void> => {
    const { showcaseId } = req.params
    logger.debug({ showcaseId }, 'Admin: list assets')

    try {
      const assets = await AssetModel.find({ showcase_id: showcaseId }).lean()
      const result = assets.map((asset) => ({
        id: asset._id.toString(),
        filename: asset.filename,
        mime_type: asset.mime_type,
        size_bytes: asset.size_bytes,
        url: `/uploads/${showcaseId}/${asset.filename}`,
        created_at: (asset as unknown as { createdAt: Date }).createdAt,
      }))
      res.json(result)
    } catch (err) {
      logger.error(err, 'Error listing assets')
      res.status(500).json({ error: 'Failed to list assets' })
    }
  },
)

/**
 * DELETE /admin/assets/:showcaseId/:assetId
 * Delete a single asset: remove file from disk and DB record.
 */
router.delete(
  '/:showcaseId/:assetId',
  deleteLimiter,
  requireRole(['admin']),
  validateShowcase,
  async (req: Request, res: Response): Promise<void> => {
    const { showcaseId, assetId } = req.params

    if (!mongoose.Types.ObjectId.isValid(assetId)) {
      res.status(400).json({ error: 'Invalid asset ID format' })
      return
    }

    logger.debug({ showcaseId, assetId }, 'Admin: delete asset')

    try {
      const asset = await AssetModel.findOne({ _id: assetId, showcase_id: showcaseId })
      if (!asset) {
        res.status(404).json({ error: 'Asset not found' })
        return
      }

      // Remove file from disk; ENOENT means it's already gone, which is fine.
      await fs.unlink(asset.path).catch((err: NodeJS.ErrnoException) => {
        if (err.code !== 'ENOENT') throw err
      })

      await AssetModel.deleteOne({ _id: assetId })
      res.status(204).send()
    } catch (err) {
      logger.error(err, 'Error deleting asset')
      res.status(500).json({ error: 'Failed to delete asset' })
    }
  },
)

// Multer error handler -- must be placed after all route handlers.
// Express identifies error handlers by arity (4 args); _next is required but unused.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
router.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File size must be less than 5MB' })
      return
    }
  }
  if (error.message.toLowerCase().includes('only image files')) {
    res.status(400).json({ error: error.message })
    return
  }
  logger.error(error, 'File upload error')
  res.status(500).json({ error: 'File upload failed' })
})

export default router
