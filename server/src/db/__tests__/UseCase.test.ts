import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Schema, model } from 'mongoose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { baseSchemaOptions } from '../baseSchema'
import { UseCaseSchema } from '../models/UseCase'

let mongod: MongoMemoryServer

// Wrap the embedded schema in a throwaway top-level model so we can persist it.
const HostSchema = new Schema({ useCases: [UseCaseSchema] }, baseSchemaOptions)
// Guard prevents "Cannot overwrite model" errors when the module is re-evaluated
// (e.g. vitest watch mode or hot reload).
const HostModel = mongoose.models['UseCaseHost'] ?? model('UseCaseHost', HostSchema)

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('UseCaseSchema', () => {
  it('persists a minimal UseCase with hidden defaulting to false', async () => {
    const doc = await HostModel.create({ useCases: [{ id: 'clothesOnline', name: 'Clothes Online' }] })
    const uc = doc.toJSON().useCases[0]
    expect(uc.id).toBe('clothesOnline')
    expect(uc.name).toBe('Clothes Online')
    expect(uc.hidden).toBe(false)
  })

  it('rejects a UseCase missing a required field', async () => {
    await expect(HostModel.create({ useCases: [{ name: 'No ID' }] })).rejects.toThrow()
  })
})

describe('UseCaseScreenSchema', () => {
  it('persists a screen with optional verifier', async () => {
    const doc = await HostModel.create({
      useCases: [
        {
          id: 'uc1',
          name: 'UC1',
          screens: [
            {
              screenId: 'PROOF',
              title: 'Proof',
              text: 'Show credentials',
              verifier: { name: 'BC Services', icon: '/icon.svg' },
            },
          ],
        },
      ],
    })
    const screen = doc.toJSON().useCases[0].screens[0]
    expect(screen.screenId).toBe('PROOF')
    expect(screen.verifier.name).toBe('BC Services')
  })
})

describe('CredentialRequestSchema', () => {
  it('persists requestedCredentials with nonRevoked timestamps', async () => {
    const now = Math.floor(Date.now() / 1000)
    const doc = await HostModel.create({
      useCases: [
        {
          id: 'uc2',
          name: 'UC2',
          screens: [
            {
              screenId: 'PROOF',
              title: 'T',
              text: 'X',
              requestOptions: {
                title: 'Needed',
                text: 'Provide the following',
                requestedCredentials: [
                  { name: 'Driver Licence', schema_id: 'abc:1:2:3', nonRevoked: { to: now, from: now - 3600 } },
                ],
              },
            },
          ],
        },
      ],
    })
    const cred = doc.toJSON().useCases[0].screens[0].requestOptions.requestedCredentials[0]
    expect(cred.name).toBe('Driver Licence')
    expect(cred.schema_id).toBe('abc:1:2:3')
    expect(cred.nonRevoked.to).toBe(now)
  })

  it('rejects a CredentialRequest missing name', async () => {
    await expect(
      HostModel.create({
        useCases: [
          {
            id: 'uc3',
            name: 'UC3',
            screens: [
              {
                screenId: 'PROOF',
                title: 'T',
                text: 'X',
                requestOptions: { title: 'T', text: 'X', requestedCredentials: [{ icon: '/x.svg' }] },
              },
            ],
          },
        ],
      }),
    ).rejects.toThrow()
  })
})
