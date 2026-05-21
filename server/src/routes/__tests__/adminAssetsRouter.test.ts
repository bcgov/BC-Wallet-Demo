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
  // vi.hoisted runs before imports so ES modules are unavailable; use process globals directly.
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
import { ShowcaseModel } from '../../db/models/Showcase'
import { sanitizeSVG } from '../../utils/sanitizeSVG'
import { validateFileType } from '../../utils/validateFileType'
import adminAssetsRouter from '../adminAssetsRouter'

let mongod: MongoMemoryServer

const app = express()
app.use(json())
app.use('/admin/assets', adminAssetsRouter)

// Minimal PNG magic bytes -- validateFileType is mocked so content doesn't matter,
// but multer still writes the buffer to disk so use something non-empty.
const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])

const baseShowcase = {
  name: 'Assets Router Test Showcase',
  persona: { name: 'Alice', type: 'AssetsRouterTest', image: '/public/student/student.svg' },
}

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
  await ShowcaseModel.deleteMany({})
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
  await fs.rm(testUploadsDir, { recursive: true, force: true })
})

// Helper: create a showcase with a unique name to avoid index conflicts
let showcaseCounter = 0
async function createShowcase(overrides?: Partial<typeof baseShowcase>) {
  showcaseCounter++
  return ShowcaseModel.create({
    ...baseShowcase,
    name: `${baseShowcase.name} ${showcaseCounter}`,
    persona: { ...baseShowcase.persona, type: `AssetsRouterTest${showcaseCounter}` },
    ...overrides,
  })
}

describe('POST /admin/assets/:showcaseId', () => {
  it('returns 201 with asset metadata on valid upload', async () => {
    const showcase = await createShowcase()
    const showcaseId = showcase._id.toString()

    const res = await request(app)
      .post(`/admin/assets/${showcaseId}`)
      .attach('file', fakePng, { filename: 'test.png', contentType: 'image/png' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      filename: expect.stringContaining('.png'),
      mime_type: 'image/png',
      size_bytes: fakePng.length,
      url: expect.stringContaining(showcaseId),
    })
    expect(res.body.id).toBeDefined()
  })

  it('creates an Asset DB record on successful upload', async () => {
    const showcase = await createShowcase()
    const showcaseId = showcase._id.toString()

    await request(app)
      .post(`/admin/assets/${showcaseId}`)
      .attach('file', fakePng, { filename: 'record-test.png', contentType: 'image/png' })

    const assets = await AssetModel.find({ showcase_id: showcase._id })
    expect(assets).toHaveLength(1)
    expect(assets[0].filename).toMatch(/\.png$/)
    expect(assets[0].mime_type).toBe('image/png')
    expect(assets[0].size_bytes).toBe(fakePng.length)
  })

  it('returns 400 when no file is provided', async () => {
    const showcase = await createShowcase()

    const res = await request(app).post(`/admin/assets/${showcase._id.toString()}`)
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when showcaseId is not a valid ObjectId', async () => {
    const res = await request(app)
      .post('/admin/assets/not-a-valid-id')
      .attach('file', fakePng, { filename: 'test.png', contentType: 'image/png' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 404 when showcase does not exist', async () => {
    const nonexistentId = new mongoose.Types.ObjectId().toString()

    const res = await request(app)
      .post(`/admin/assets/${nonexistentId}`)
      .attach('file', fakePng, { filename: 'test.png', contentType: 'image/png' })

    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when file type validation fails', async () => {
    vi.mocked(validateFileType).mockResolvedValue(false)
    const showcase = await createShowcase()
    const showcaseId = showcase._id.toString()

    const res = await request(app)
      .post(`/admin/assets/${showcaseId}`)
      .attach('file', fakePng, { filename: 'bad.png', contentType: 'image/png' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    // No DB record should have been created
    const assets = await AssetModel.find({ showcase_id: showcase._id })
    expect(assets).toHaveLength(0)
  })

  it('rejects files with disallowed extensions', async () => {
    const showcase = await createShowcase()
    const showcaseId = showcase._id.toString()

    const res = await request(app)
      .post(`/admin/assets/${showcaseId}`)
      .attach('file', Buffer.from('not an image'), { filename: 'malware.exe', contentType: 'application/octet-stream' })

    expect(res.status).toBe(400)
  })

  it('sanitizes SVG files on upload', async () => {
    const showcase = await createShowcase()
    const showcaseId = showcase._id.toString()

    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'

    const res = await request(app)
      .post(`/admin/assets/${showcaseId}`)
      .attach('file', Buffer.from(svgContent), { filename: 'icon.svg', contentType: 'image/svg+xml' })

    expect(res.status).toBe(201)
    expect(vi.mocked(sanitizeSVG)).toHaveBeenCalledWith(svgContent)
  })

  it('stores file in uploads/{showcaseId}/ directory', async () => {
    const showcase = await createShowcase()
    const showcaseId = showcase._id.toString()

    const res = await request(app)
      .post(`/admin/assets/${showcaseId}`)
      .attach('file', fakePng, { filename: 'location-test.png', contentType: 'image/png' })

    expect(res.status).toBe(201)
    // Asset path in DB should be under the showcase-specific dir
    const asset = await AssetModel.findOne({ showcase_id: showcase._id })
    expect(asset?.path).toContain(showcaseId)
  })
})

describe('GET /admin/assets/:showcaseId', () => {
  it('returns 200 with empty array when no assets exist', async () => {
    const showcase = await createShowcase()

    const res = await request(app).get(`/admin/assets/${showcase._id.toString()}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(0)
  })

  it('returns 200 with asset metadata array including url', async () => {
    const showcase = await createShowcase()
    await AssetModel.create({
      showcase_id: showcase._id,
      filename: 'logo.png',
      path: path.join(testUploadsDir, 'logo.png'),
      mime_type: 'image/png',
      size_bytes: 1024,
    })

    const res = await request(app).get(`/admin/assets/${showcase._id.toString()}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).toMatchObject({
      filename: 'logo.png',
      mime_type: 'image/png',
      size_bytes: 1024,
    })
    expect(res.body[0].url).toBeDefined()
    expect(res.body[0].id).toBeDefined()
  })

  it('returns only assets belonging to the requested showcase', async () => {
    const showcase1 = await createShowcase()
    const showcase2 = await createShowcase()

    await AssetModel.create({
      showcase_id: showcase1._id,
      filename: 'for-showcase1.png',
      path: '/tmp/for-showcase1.png',
      mime_type: 'image/png',
      size_bytes: 100,
    })
    await AssetModel.create({
      showcase_id: showcase2._id,
      filename: 'for-showcase2.png',
      path: '/tmp/for-showcase2.png',
      mime_type: 'image/png',
      size_bytes: 100,
    })

    const res = await request(app).get(`/admin/assets/${showcase1._id.toString()}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].filename).toBe('for-showcase1.png')
  })

  it('returns 400 when showcaseId is not a valid ObjectId', async () => {
    const res = await request(app).get('/admin/assets/not-valid')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 404 when showcase does not exist', async () => {
    const nonexistentId = new mongoose.Types.ObjectId().toString()
    const res = await request(app).get(`/admin/assets/${nonexistentId}`)
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})

describe('DELETE /admin/assets/:showcaseId/:assetId', () => {
  it('returns 204 on successful deletion', async () => {
    const showcase = await createShowcase()
    const tmpFile = path.join(testUploadsDir, `del-success-${Date.now()}.png`)
    await fs.writeFile(tmpFile, fakePng)

    const asset = await AssetModel.create({
      showcase_id: showcase._id,
      filename: 'del-success.png',
      path: tmpFile,
      mime_type: 'image/png',
      size_bytes: fakePng.length,
    })

    const res = await request(app).delete(`/admin/assets/${showcase._id.toString()}/${asset._id.toString()}`)
    expect(res.status).toBe(204)
  })

  it('removes file from disk on deletion', async () => {
    const showcase = await createShowcase()
    const tmpFile = path.join(testUploadsDir, `del-disk-${Date.now()}.png`)
    await fs.writeFile(tmpFile, fakePng)

    const asset = await AssetModel.create({
      showcase_id: showcase._id,
      filename: 'del-disk.png',
      path: tmpFile,
      mime_type: 'image/png',
      size_bytes: fakePng.length,
    })

    await request(app).delete(`/admin/assets/${showcase._id.toString()}/${asset._id.toString()}`)

    await expect(fs.access(tmpFile)).rejects.toThrow()
  })

  it('removes DB record on deletion', async () => {
    const showcase = await createShowcase()
    const tmpFile = path.join(testUploadsDir, `del-db-${Date.now()}.png`)
    await fs.writeFile(tmpFile, fakePng)

    const asset = await AssetModel.create({
      showcase_id: showcase._id,
      filename: 'del-db.png',
      path: tmpFile,
      mime_type: 'image/png',
      size_bytes: fakePng.length,
    })

    await request(app).delete(`/admin/assets/${showcase._id.toString()}/${asset._id.toString()}`)

    const remaining = await AssetModel.findById(asset._id)
    expect(remaining).toBeNull()
  })

  it('handles missing file on disk gracefully (ENOENT)', async () => {
    const showcase = await createShowcase()
    const asset = await AssetModel.create({
      showcase_id: showcase._id,
      filename: 'gone.png',
      path: '/tmp/this-file-does-not-exist-anywhere-at-all.png',
      mime_type: 'image/png',
      size_bytes: 100,
    })

    const res = await request(app).delete(`/admin/assets/${showcase._id.toString()}/${asset._id.toString()}`)

    // Should succeed even though file is missing on disk
    expect(res.status).toBe(204)
    // DB record should be removed
    const remaining = await AssetModel.findById(asset._id)
    expect(remaining).toBeNull()
  })

  it('returns 400 when assetId is not a valid ObjectId', async () => {
    const showcase = await createShowcase()

    const res = await request(app).delete(`/admin/assets/${showcase._id.toString()}/not-valid-id`)
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when showcaseId is not a valid ObjectId', async () => {
    const fakeAssetId = new mongoose.Types.ObjectId().toString()
    const res = await request(app).delete(`/admin/assets/not-valid/${fakeAssetId}`)
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 404 when showcase does not exist', async () => {
    const nonexistentId = new mongoose.Types.ObjectId().toString()
    const fakeAssetId = new mongoose.Types.ObjectId().toString()

    const res = await request(app).delete(`/admin/assets/${nonexistentId}/${fakeAssetId}`)
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 404 when asset does not exist for the given showcase', async () => {
    const showcase = await createShowcase()
    const fakeAssetId = new mongoose.Types.ObjectId().toString()

    const res = await request(app).delete(`/admin/assets/${showcase._id.toString()}/${fakeAssetId}`)
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  it('cannot delete an asset belonging to a different showcase', async () => {
    const showcase1 = await createShowcase()
    const showcase2 = await createShowcase()

    const asset = await AssetModel.create({
      showcase_id: showcase2._id,
      filename: 'other.png',
      path: '/tmp/other.png',
      mime_type: 'image/png',
      size_bytes: 100,
    })

    // Try to delete asset of showcase2 via showcase1's ID
    const res = await request(app).delete(`/admin/assets/${showcase1._id.toString()}/${asset._id.toString()}`)
    expect(res.status).toBe(404)
  })
})
