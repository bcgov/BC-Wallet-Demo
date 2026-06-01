import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { ShowcaseModel } from '../models/Showcase'

let mongod: MongoMemoryServer

const minimal = {
  name: 'Student Showcase',
  persona: { name: 'Alice', type: 'Student', image: '/public/student/student.svg' },
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  // Explicitly build indexes for MongoDB Memory Server
  await ShowcaseModel.syncIndexes()
})

// Clear between tests so documents from one test cannot affect another.
afterEach(async () => {
  await ShowcaseModel.deleteMany({})
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('ShowcaseModel', () => {
  it('persists a showcase with required fields', async () => {
    const doc = await ShowcaseModel.create(minimal)
    const json = doc.toJSON()
    expect(json.name).toBe('Student Showcase')
    expect(json.persona.name).toBe('Alice')
    expect(json.persona.type).toBe('Student')
    expect(json.persona.image).toBe('/public/student/student.svg')
    expect(json.status).toBe('active')
  })

  it('rejects a showcase with a missing required field', async () => {
    await expect(ShowcaseModel.create({ persona: { name: 'Alice', type: 'Student' } })).rejects.toThrow()
  })

  it('persists a showcase without optional persona field', async () => {
    const doc = await ShowcaseModel.create({ name: 'No Persona Showcase' })
    const json = doc.toJSON()
    expect(json.name).toBe('No Persona Showcase')
    expect(json.persona).toBeUndefined()
    expect(json.status).toBe('active')
  })

  it('enforces unique index on persona.type', async () => {
    await ShowcaseModel.create({ ...minimal, persona: { ...minimal.persona, type: 'UniqueType' } })
    await expect(
      ShowcaseModel.create({
        name: 'Other Showcase',
        persona: { name: 'Bob', type: 'UniqueType', image: '/b.svg' },
      }),
    ).rejects.toThrow()
  })
})

describe('IntroductionStep embedded schema', () => {
  it('persists an introduction step with credential references and top-level credential IDs', async () => {
    const doc = await ShowcaseModel.create({
      ...minimal,
      persona: { ...minimal.persona, type: 'Student-introduction' },
      credentials: ['student-card'],
      introduction: [
        {
          screenId: 'PICK_CREDENTIAL',
          name: 'Get your card',
          text: 'Scan to receive',
          issuer_name: 'Best BC College',
          credentials: ['student-card'],
        },
      ],
    })
    const json = doc.toJSON()
    const step = json.introduction[0]
    expect(step.screenId).toBe('PICK_CREDENTIAL')
    expect(step.issuer_name).toBe('Best BC College')
    expect(step.credentials?.[0]).toBe('student-card')
    expect(json.credentials[0]).toBe('student-card')
  })
})

describe('ProgressBarStep embedded schema', () => {
  it('persists progress bar steps', async () => {
    const doc = await ShowcaseModel.create({
      ...minimal,
      persona: { ...minimal.persona, type: 'Student-progress' },
      progressBar: [
        { name: 'person', introductionStep: 'PICK_CHARACTER', iconLight: '/light.svg', iconDark: '/dark.svg' },
      ],
    })
    const step = doc.toJSON().progressBar[0]
    expect(step.name).toBe('person')
    expect(step.introductionStep).toBe('PICK_CHARACTER')
  })
})

describe('RevocationInfoItem embedded schema', () => {
  it('persists revocation info', async () => {
    const doc = await ShowcaseModel.create({
      ...minimal,
      persona: { ...minimal.persona, type: 'Student-revocation' },
      revocationInfo: [
        {
          credentialName: 'Student Card',
          credentialIcon: '/icon.svg',
          name: 'Revoke',
          description: 'You can revoke if...',
        },
      ],
    })
    expect(doc.toJSON().revocationInfo[0].credentialName).toBe('Student Card')
  })
})

describe('soft-delete: deleted_at field', () => {
  it('defaults deleted_at to null', async () => {
    const doc = await ShowcaseModel.create(minimal)
    expect(doc.deleted_at).toBeNull()
  })

  it('stores a date when soft-deleted', async () => {
    const before = new Date()
    const doc = await ShowcaseModel.create(minimal)
    await ShowcaseModel.updateOne({ _id: doc._id }, { deleted_at: new Date() })
    const updated = await ShowcaseModel.findById(doc._id).lean()
    expect(updated?.deleted_at).toBeDefined()
    expect(updated?.deleted_at?.getTime()).toBeGreaterThanOrEqual(before.getTime())
  })

  it('excludes soft-deleted showcases from deleted_at: null queries', async () => {
    await ShowcaseModel.create(minimal)
    await ShowcaseModel.create({ ...minimal, name: 'Trashed Showcase', persona: undefined })
    await ShowcaseModel.updateOne({ name: 'Trashed Showcase' }, { deleted_at: new Date() })

    const active = await ShowcaseModel.find({ deleted_at: null }).lean()
    expect(active.map((s) => s.name)).toContain('Student Showcase')
    expect(active.map((s) => s.name)).not.toContain('Trashed Showcase')
  })

  it('returns soft-deleted showcases when querying deleted_at: { $ne: null }', async () => {
    await ShowcaseModel.create(minimal)
    await ShowcaseModel.create({ ...minimal, name: 'Trashed Showcase', persona: undefined })
    await ShowcaseModel.updateOne({ name: 'Trashed Showcase' }, { deleted_at: new Date() })

    const deleted = await ShowcaseModel.find({ deleted_at: { $ne: null } }).lean()
    expect(deleted.map((s) => s.name)).toEqual(['Trashed Showcase'])
  })

  it('can clear deleted_at to restore a showcase', async () => {
    const doc = await ShowcaseModel.create(minimal)
    await ShowcaseModel.updateOne({ _id: doc._id }, { deleted_at: new Date() })
    await ShowcaseModel.updateOne({ _id: doc._id }, { deleted_at: null })
    const restored = await ShowcaseModel.findById(doc._id).lean()
    expect(restored?.deleted_at).toBeNull()
  })
})

describe('Scenario embedded in Showcase', () => {
  it('persists scenarios with screens', async () => {
    const doc = await ShowcaseModel.create({
      ...minimal,
      persona: { ...minimal.persona, type: 'Student-scenario' },
      scenarios: [
        {
          id: 'clothesOnline',
          name: 'Clothes Online',
          screens: [{ screenId: 'START', name: 'Welcome', text: 'Begin the demo' }],
        },
      ],
    })
    const sc = doc.toJSON().scenarios[0]
    expect(sc.id).toBe('clothesOnline')
    expect(sc.screens[0].screenId).toBe('START')
  })
})
