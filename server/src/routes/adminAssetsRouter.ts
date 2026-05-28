import type { NextFunction, Request, Response } from 'express'

import { randomUUID } from 'crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { mkdirSync, readdirSync } from 'fs'
import mongoose from 'mongoose'
import multer from 'multer'
import fs from 'node:fs/promises'
import path from 'path'

import { AssetModel } from '../db/models/Asset'
import { requireRole } from '../middleware/requireAdmin'
import logger from '../utils/logger'
import { sanitizeFilename } from '../utils/sanitizeFilename'
import { sanitizeSVG } from '../utils/sanitizeSVG'
import { UPLOADS_DIR } from '../utils/uploadsDir'
import { validateFileType } from '../utils/validateFileType'

const ALLOWED_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const STATIC_ASSET_TYPES = ['icon', 'screen', 'persona'] as const

// Cache static (bundled) image paths per type at startup so we don't readdir on every request.
// Exported for testing.
export const staticAssetCache = new Map<string, string[]>()
function loadStaticAssets() {
  for (const type of STATIC_ASSET_TYPES) {
    const dir = path.join(__dirname, '..', 'public', 'common', type)
    try {
      const entries = readdirSync(dir)
      staticAssetCache.set(
        type,
        entries
          .filter((e: string) => ALLOWED_EXTENSIONS.includes(path.extname(e).toLowerCase()))
          .map((e: string) => `/public/common/${type}/${e}`),
      )
    } catch {
      staticAssetCache.set(type, [])
    }
  }
}
loadStaticAssets()

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

// Ensure uploads dir exists at module load time.
mkdirSync(UPLOADS_DIR, { recursive: true })

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, UPLOADS_DIR)
    },
    filename: (_req: Request, file: Express.Multer.File, cb: (err: Error | null, filename: string) => void) => {
      const baseFilename = sanitizeFilename(file.originalname, UPLOADS_DIR)
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
 * POST /admin/assets
 * Upload an image asset. Accepts optional `type` form field for categorization
 * (e.g. 'icon', 'screen', 'persona'). Stored flat under UPLOADS_DIR.
 * Returns { path, filename } where path is the URL for use in showcase config.
 */
router.post(
  '/',
  uploadLimiter,
  requireRole(['admin', 'creator']),
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    // Path traversal guard: ensure multer wrote within UPLOADS_DIR.
    const uploadsRoot = path.resolve(UPLOADS_DIR)
    const safeFilePath = path.resolve(req.file.path)
    if (!safeFilePath.startsWith(uploadsRoot + path.sep)) {
      await fs.unlink(safeFilePath).catch(() => {})
      res.status(400).json({ error: 'Invalid file path' })
      return
    }

    const type = typeof req.body.type === 'string' && req.body.type ? req.body.type : undefined

    logger.debug({ filename: req.file.filename, type }, 'Admin: upload asset')

    // Validate file content by magic bytes.
    try {
      const fileBuffer = await fs.readFile(safeFilePath)
      const isValid = await validateFileType(fileBuffer, req.file.filename)
      if (!isValid) {
        await fs.unlink(safeFilePath).catch(() => {})
        res.status(400).json({ error: 'File type validation failed. Upload a valid image file.' })
        return
      }
    } catch (err) {
      logger.error(err, 'Error validating file type')
      await fs.unlink(safeFilePath).catch(() => {})
      res.status(500).json({ error: 'Failed to validate file type' })
      return
    }

    // Sanitize SVG content to strip dangerous markup.
    const ext = path.extname(req.file.filename).toLowerCase()
    if (ext === '.svg') {
      try {
        const content = await fs.readFile(safeFilePath, 'utf-8')
        const sanitized = sanitizeSVG(content)
        await fs.writeFile(safeFilePath, sanitized, 'utf-8')
      } catch (err) {
        logger.error(err, 'Error sanitizing SVG')
        await fs.unlink(safeFilePath).catch(() => {})
        res.status(500).json({ error: 'Failed to sanitize SVG file' })
        return
      }
    }

    const mimeType = EXT_TO_MIME[ext] ?? 'application/octet-stream'

    try {
      await AssetModel.create({
        filename: req.file.filename,
        mime_type: mimeType,
        size_bytes: req.file.size,
        type,
      })

      res.status(201).json({
        path: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
      })
    } catch (err) {
      logger.error(err, 'Error creating asset record')
      await fs.unlink(safeFilePath).catch(() => {})
      res.status(500).json({ error: 'Failed to save asset record' })
    }
  },
)

/**
 * GET /admin/assets?type=icon
 * List assets, optionally filtered by type tag.
 * Returns { files: string[] } of URL paths for use in image pickers.
 */
router.get(
  '/',
  getLimiter,
  requireRole(['admin', 'creator', 'viewer']),
  async (req: Request, res: Response): Promise<void> => {
    const type = typeof req.query.type === 'string' && req.query.type ? req.query.type : undefined
    const filter = type ? { type } : {}

    logger.debug({ type }, 'Admin: list assets')

    try {
      const assets = await AssetModel.find(filter).lean()
      const uploadedFiles = assets.map((a) => `/uploads/${a.filename}`)

      // Merge in static (bundled) images cached at startup.
      const staticFiles = type ? (staticAssetCache.get(type) ?? []) : []

      res.json({ files: [...staticFiles, ...uploadedFiles] })
    } catch (err) {
      logger.error(err, 'Error listing assets')
      res.status(500).json({ error: 'Failed to list assets' })
    }
  },
)

/**
 * DELETE /admin/assets/:assetId
 * Delete a single asset: remove file from disk and DB record.
 */
router.delete(
  '/:assetId',
  deleteLimiter,
  requireRole(['admin']),
  async (req: Request, res: Response): Promise<void> => {
    const { assetId } = req.params

    if (!mongoose.Types.ObjectId.isValid(assetId)) {
      res.status(400).json({ error: 'Invalid asset ID format' })
      return
    }

    logger.debug({ assetId }, 'Admin: delete asset')

    try {
      const asset = await AssetModel.findById(assetId)
      if (!asset) {
        res.status(404).json({ error: 'Asset not found' })
        return
      }

      // Path traversal guard before unlinking.
      const diskPath = path.resolve(UPLOADS_DIR, asset.filename)
      if (!diskPath.startsWith(UPLOADS_DIR + path.sep)) {
        res.status(400).json({ error: 'Invalid asset path' })
        return
      }
      await fs.unlink(diskPath).catch((err: NodeJS.ErrnoException) => {
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
