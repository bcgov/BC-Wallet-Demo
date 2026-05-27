import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { OobInvitationModel } from '../../db/models/OobInvitation'
import { persistOobInvitation } from '../../services/oobInvitationStore'
import { serveOobInvitation } from '../serveOobInvitation'

let mongod: MongoMemoryServer

const mockRes = () => {
  const res: {
    statusCode: number
    body?: unknown
    headers: Record<string, string>
    status: (code: number) => typeof res
    json: (body: unknown) => typeof res
    setHeader: (name: string, value: string) => typeof res
    send: (body: unknown) => typeof res
  } = {
    statusCode: 200,
    headers: {},
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(body: unknown) {
      res.body = body
      return res
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value
      return res
    },
    send(body: unknown) {
      res.body = body
      return res
    },
  }
  return res
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterEach(async () => {
  await OobInvitationModel.deleteMany({})
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('serveOobInvitation', () => {
  const originalFlag = process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED
    } else {
      process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED = originalFlag
    }
  })

  it('returns 404 when short invitation URLs are disabled', async () => {
    process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED = 'false'
    const req = { params: { code: 'oob-serve-1' } } as any
    const res = mockRes()

    await serveOobInvitation(req, res as any)

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ error: 'Short invitation URLs are disabled' })
  })

  it('returns invitation JSON for a known oob id', async () => {
    delete process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED
    const invitation = {
      '@type': 'https://didcomm.org/out-of-band/1.1/invitation',
      '@id': 'oob-serve-1',
    }
    await persistOobInvitation({ oobId: 'oob-serve-1', invitation })

    const req = { params: { code: 'oob-serve-1' } } as any
    const res = mockRes()

    await serveOobInvitation(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(res.headers['Content-Type']).toBe('application/json')
    expect(res.body).toEqual(invitation)
  })

  it('returns 404 when oob id is unknown', async () => {
    const req = { params: { code: 'missing' } } as any
    const res = mockRes()

    await serveOobInvitation(req, res as any)

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ error: 'Invitation not found' })
  })

  it('returns 410 when invitation is expired', async () => {
    await OobInvitationModel.create({
      _id: 'expired-oob',
      invitation: { '@id': 'expired-oob' },
      kind: 'connection',
      expiresAt: new Date(Date.now() - 60_000),
    })

    const req = { params: { code: 'expired-oob' } } as any
    const res = mockRes()

    await serveOobInvitation(req, res as any)

    expect(res.statusCode).toBe(410)
    expect(res.body).toEqual({ error: 'Invitation expired' })
  })

  it('decodes URL-encoded oob id', async () => {
    const invitation = { '@id': 'id/with' }
    await persistOobInvitation({ oobId: 'id/with', invitation })

    const req = { params: { code: encodeURIComponent('id/with') } } as any
    const res = mockRes()

    await serveOobInvitation(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(invitation)
  })
})
