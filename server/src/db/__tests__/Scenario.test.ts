import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Schema, model } from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { baseSchemaOptions } from '../baseSchema'
import { ScenarioSchema } from '../models/Scenario'

let mongod: MongoMemoryServer

// Wrap the embedded schema in a throwaway top-level model so we can persist it.
const HostSchema = new Schema({ scenarios: [ScenarioSchema] }, baseSchemaOptions)
// Guard prevents "Cannot overwrite model" errors when the module is re-evaluated
// (e.g. vitest watch mode or hot reload).
const HostModel = mongoose.models['ScenarioHost'] ?? model('ScenarioHost', HostSchema)

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

// Clear between tests so documents from one test cannot affect another.
afterEach(async () => {
  await HostModel.deleteMany({})
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('ScenarioSchema', () => {
  it('persists a minimal Scenario with hidden defaulting to false', async () => {
    const doc = await HostModel.create({ scenarios: [{ id: 'clothesOnline', name: 'Clothes Online' }] })
    const sc = doc.toJSON().scenarios[0]
    expect(sc.id).toBe('clothesOnline')
    expect(sc.name).toBe('Clothes Online')
    expect(sc.hidden).toBe(false)
  })

  it('rejects a Scenario missing a required field', async () => {
    await expect(HostModel.create({ scenarios: [{ name: 'No ID' }] })).rejects.toThrow()
  })
})

describe('ScenarioScreenSchema', () => {
  it('persists a screen with optional verifier', async () => {
    const doc = await HostModel.create({
      scenarios: [
        {
          id: 'uc1',
          name: 'UC1',
          screens: [
            {
              screenId: 'PROOF',
              name: 'Proof',
              text: 'Show credentials',
              verifier: { name: 'BC Services', icon: '/icon.svg' },
            },
          ],
        },
      ],
    })
    const screen = doc.toJSON().scenarios[0].screens[0]
    expect(screen.screenId).toBe('PROOF')
    expect(screen.verifier.name).toBe('BC Services')
  })
})

describe('CredentialRequestSchema', () => {
  it('persists requestedCredentials with nonRevoked timestamps', async () => {
    const now = Math.floor(Date.now() / 1000)
    const doc = await HostModel.create({
      scenarios: [
        {
          id: 'uc2',
          name: 'UC2',
          screens: [
            {
              screenId: 'PROOF',
              name: 'T',
              text: 'X',
              requestOptions: {
                name: 'Needed',
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
    const cred = doc.toJSON().scenarios[0].screens[0].requestOptions.requestedCredentials[0]
    expect(cred.name).toBe('Driver Licence')
    expect(cred.schema_id).toBe('abc:1:2:3')
    expect(cred.nonRevoked.to).toBe(now)
  })

  it('rejects a CredentialRequest missing name', async () => {
    await expect(
      HostModel.create({
        scenarios: [
          {
            id: 'uc3',
            name: 'UC3',
            screens: [
              {
                screenId: 'PROOF',
                name: 'T',
                text: 'X',
                requestOptions: { name: 'T', text: 'X', requestedCredentials: [{ icon: '/x.svg' }] },
              },
            ],
          },
        ],
      }),
    ).rejects.toThrow()
  })
})
