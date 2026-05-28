import express, { json } from 'express'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { mkdirSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Set UPLOADS_DIR before the router module is imported.
// vi.hoisted runs before all vi.mock calls and imports.
const { testUploadsDir } = vi.hoisted(() => {
  const tmpdir = process.env.TMPDIR ?? process.env.TEMP ?? '/tmp'
  const dir = `${tmpdir}/asset-router-test-${Date.now()}`
  process.env.UPLOADS_DIR = dir
  return { testUploadsDir: dir }
})

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../middleware/requireAdmin', () => ({
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('express-rate-limit', () => ({
  default: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('../../utils/validateFileType', () => ({
  validateFileType: vi.fn().mockResolvedValue(true),
}))

vi.mock('../../utils/sanitizeSVG', () => ({
  sanitizeSVG: vi.fn((content: string) => content),
}))

import { AssetModel } from '../../db/models/Asset'
import { sanitizeSVG } from '../../utils/sanitizeSVG'
import { validateFileType } from '../../utils/validateFileType'
import adminAssetsRouter, { staticAssetCache } from '../adminAssetsRouter'

let mongod: MongoMemoryServer

const app = express()
app.use(json())
app.use('/admin/assets', adminAssetsRouter)

// Minimal PNG magic bytes -- validateFileType is mocked so content doesn't matter,
// but multer still writes the buffer to disk so use something non-empty.
const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])

beforeAll(async () => {
  mkdirSync(testUploadsDir, { recursive: true })
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

beforeEach(() => {
  vi.mocked(validateFileType).mockResolvedValue(true)
  vi.mocked(sanitizeSVG).mockImplementation((content: string) => content)
})

afterEach(async () => {
  vi.clearAllMocks()
  await AssetModel.deleteMany({})
  // Remove uploaded files between tests.
  const entries = await fs.readdir(testUploadsDir).catch(() => [])
  await Promise.all(entries.map((e: string) => fs.unlink(path.join(testUploadsDir, e)).catch(() => {})))
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
  await fs.rm(testUploadsDir, { recursive: true, force: true })
})

describe('POST /admin/assets', () => {
  it('returns 201 with path and filename on valid upload', async () => {
    const res = await request(app)
      .post('/admin/assets')
      .field('type', 'icon')
      .attach('file', fakePng, { filename: 'test.png', contentType: 'image/png' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      filename: expect.stringContaining('.png'),
      path: expect.stringMatching(/^\/uploads\//),
    })
  })

  it('creates an Asset DB record with type tag on successful upload', async () => {
    await request(app)
      .post('/admin/assets')
      .field('type', 'persona')
      .attach('file', fakePng, { filename: 'avatar.png', contentType: 'image/png' })

    const assets = await AssetModel.find({ type: 'persona' })
    expect(assets).toHaveLength(1)
    expect(assets[0].filename).toMatch(/\.png$/)
    expect(assets[0].mime_type).toBe('image/png')
    expect(assets[0].type).toBe('persona')
  })

  it('accepts upload without type field', async () => {
    const res = await request(app)
      .post('/admin/assets')
      .attach('file', fakePng, { filename: 'no-type.png', contentType: 'image/png' })

    expect(res.status).toBe(201)
    const asset = await AssetModel.findOne()
    expect(asset?.type).toBeUndefined()
  })

  it('returns 400 when no file is provided', async () => {
    const res = await request(app).post('/admin/assets')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when file type validation fails', async () => {
    vi.mocked(validateFileType).mockResolvedValue(false)

    const res = await request(app)
      .post('/admin/assets')
      .attach('file', fakePng, { filename: 'bad.png', contentType: 'image/png' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(await AssetModel.countDocuments()).toBe(0)
  })

  it('rejects files with disallowed extensions', async () => {
    const res = await request(app)
      .post('/admin/assets')
      .attach('file', Buffer.from('not an image'), { filename: 'malware.exe', contentType: 'application/octet-stream' })

    expect(res.status).toBe(400)
  })

  it('sanitizes SVG files on upload', async () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'

    const res = await request(app)
      .post('/admin/assets')
      .field('type', 'icon')
      .attach('file', Buffer.from(svgContent), { filename: 'icon.svg', contentType: 'image/svg+xml' })

    expect(res.status).toBe(201)
    expect(vi.mocked(sanitizeSVG)).toHaveBeenCalledWith(svgContent)
  })

  it('stores file flat in UPLOADS_DIR (no subdirectory)', async () => {
    const res = await request(app)
      .post('/admin/assets')
      .field('type', 'screen')
      .attach('file', fakePng, { filename: 'flat-test.png', contentType: 'image/png' })

    expect(res.status).toBe(201)
    const asset = await AssetModel.findOne()
    // filename should be just a flat name with no path separator
    expect(asset?.filename).not.toContain('/')
    expect(asset?.filename).toMatch(/\.png$/)
  })
})

describe('GET /admin/assets', () => {
  afterEach(() => {
    staticAssetCache.clear()
  })

  it('returns { files: [] } when no assets exist', async () => {
    const res = await request(app).get('/admin/assets')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ files: [] })
  })

  it('returns all assets when no type filter applied', async () => {
    await AssetModel.create({ filename: 'a.png', mime_type: 'image/png', size_bytes: 100, type: 'icon' })
    await AssetModel.create({ filename: 'b.png', mime_type: 'image/png', size_bytes: 100, type: 'persona' })

    const res = await request(app).get('/admin/assets')

    expect(res.status).toBe(200)
    expect(res.body.files).toHaveLength(2)
  })

  it('filters by type query param', async () => {
    await AssetModel.create({ filename: 'icon.png', mime_type: 'image/png', size_bytes: 100, type: 'icon' })
    await AssetModel.create({ filename: 'persona.png', mime_type: 'image/png', size_bytes: 100, type: 'persona' })

    const res = await request(app).get('/admin/assets?type=icon')

    expect(res.status).toBe(200)
    expect(res.body.files).toHaveLength(1)
    expect(res.body.files[0]).toContain('icon.png')
  })

  it('returns URL paths in files array', async () => {
    await AssetModel.create({ filename: 'logo.png', mime_type: 'image/png', size_bytes: 512 })

    const res = await request(app).get('/admin/assets')

    expect(res.status).toBe(200)
    expect(res.body.files[0]).toBe('/uploads/logo.png')
  })

  it('includes static bundled images for the requested type', async () => {
    staticAssetCache.set('icon', ['/public/common/icon/icon-person-light.svg', '/public/common/icon/icon-wallet.png'])

    const res = await request(app).get('/admin/assets?type=icon')

    expect(res.status).toBe(200)
    expect(res.body.files).toContain('/public/common/icon/icon-person-light.svg')
    expect(res.body.files).toContain('/public/common/icon/icon-wallet.png')
  })

  it('static images appear before uploaded images', async () => {
    staticAssetCache.set('persona', ['/public/common/persona/student.svg'])
    await AssetModel.create({ filename: 'uploaded.png', mime_type: 'image/png', size_bytes: 100, type: 'persona' })

    const res = await request(app).get('/admin/assets?type=persona')

    expect(res.status).toBe(200)
    expect(res.body.files[0]).toBe('/public/common/persona/student.svg')
    expect(res.body.files[1]).toBe('/uploads/uploaded.png')
  })

  it('does not include static images for other types', async () => {
    staticAssetCache.set('icon', ['/public/common/icon/icon-person-light.svg'])
    staticAssetCache.set('persona', ['/public/common/persona/student.svg'])

    const res = await request(app).get('/admin/assets?type=icon')

    expect(res.status).toBe(200)
    expect(res.body.files).not.toContain('/public/common/persona/student.svg')
  })

  it('returns no static images when type is not provided', async () => {
    staticAssetCache.set('icon', ['/public/common/icon/icon-person-light.svg'])
    await AssetModel.create({ filename: 'uploaded.png', mime_type: 'image/png', size_bytes: 100 })

    const res = await request(app).get('/admin/assets')

    expect(res.status).toBe(200)
    // No static files when no type filter -- only DB records
    expect(res.body.files).not.toContain('/public/common/icon/icon-person-light.svg')
    expect(res.body.files).toContain('/uploads/uploaded.png')
  })

  it('returns empty files for unknown type with no DB records', async () => {
    const res = await request(app).get('/admin/assets?type=unknowntype')

    expect(res.status).toBe(200)
    expect(res.body.files).toHaveLength(0)
  })
})

describe('DELETE /admin/assets/:assetId', () => {
  it('returns 204 on successful deletion', async () => {
    const filename = `del-success-${Date.now()}.png`
    await fs.writeFile(path.join(testUploadsDir, filename), fakePng)
    const asset = await AssetModel.create({ filename, mime_type: 'image/png', size_bytes: fakePng.length })

    const res = await request(app).delete(`/admin/assets/${asset._id.toString()}`)
    expect(res.status).toBe(204)
  })

  it('removes file from disk on deletion', async () => {
    const filename = `del-disk-${Date.now()}.png`
    const absPath = path.join(testUploadsDir, filename)
    await fs.writeFile(absPath, fakePng)
    const asset = await AssetModel.create({ filename, mime_type: 'image/png', size_bytes: fakePng.length })

    await request(app).delete(`/admin/assets/${asset._id.toString()}`)

    await expect(fs.access(absPath)).rejects.toThrow()
  })

  it('removes DB record on deletion', async () => {
    const filename = `del-db-${Date.now()}.png`
    await fs.writeFile(path.join(testUploadsDir, filename), fakePng)
    const asset = await AssetModel.create({ filename, mime_type: 'image/png', size_bytes: fakePng.length })

    await request(app).delete(`/admin/assets/${asset._id.toString()}`)

    expect(await AssetModel.findById(asset._id)).toBeNull()
  })

  it('handles missing file on disk gracefully (ENOENT)', async () => {
    const asset = await AssetModel.create({ filename: 'gone.png', mime_type: 'image/png', size_bytes: 100 })

    const res = await request(app).delete(`/admin/assets/${asset._id.toString()}`)

    expect(res.status).toBe(204)
    expect(await AssetModel.findById(asset._id)).toBeNull()
  })

  it('returns 400 when assetId is not a valid ObjectId', async () => {
    const res = await request(app).delete('/admin/assets/not-valid-id')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 404 when asset does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app).delete(`/admin/assets/${fakeId}`)
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 and does not delete when asset path escapes UPLOADS_DIR', async () => {
    // Simulate a corrupted DB record with a traversal path.
    const asset = await AssetModel.create({
      filename: '../../etc/passwd',
      mime_type: 'image/png',
      size_bytes: 100,
    })

    const res = await request(app).delete(`/admin/assets/${asset._id.toString()}`)

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    // DB record must remain (we rejected before touching disk or DB).
    expect(await AssetModel.findById(asset._id)).not.toBeNull()
  })
})
