import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { CharacterModel } from '../models/Character'

let mongod: MongoMemoryServer

const minimal = { name: 'Alice', type: 'Student', image: '/public/student/student.svg' }

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

// Clear between tests so documents from one test cannot affect another.
afterEach(async () => {
  await CharacterModel.deleteMany({})
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('CharacterModel', () => {
  it('persists a character with required fields', async () => {
    const doc = await CharacterModel.create(minimal)
    const json = doc.toJSON()
    expect(json.name).toBe('Alice')
    expect(json.type).toBe('Student')
    expect(json.image).toBe('/public/student/student.svg')
    expect(json.hidden).toBe(false)
  })

  it('rejects a character with a missing required field', async () => {
    await expect(CharacterModel.create({ name: 'Alice', image: '/x.svg' })).rejects.toThrow()
  })

  it('enforces unique index on type', async () => {
    await CharacterModel.create({ ...minimal, type: 'UniqueType' })
    await expect(CharacterModel.create({ name: 'Bob', type: 'UniqueType', image: '/b.svg' })).rejects.toThrow()
  })
})

describe('OnboardingStep embedded schema', () => {
  it('persists an onboarding step with nested credentials', async () => {
    const doc = await CharacterModel.create({
      ...minimal,
      type: 'Student-onboarding',
      onboarding: [
        {
          screenId: 'PICK_CREDENTIAL',
          name: 'Get your card',
          text: 'Scan to receive',
          issuer_name: 'Best BC College',
          credentials: [
            {
              name: 'Student Card',
              icon: '/icon.svg',
              version: '1.0',
              attributes: [{ name: 'student_id', value: '12345' }],
            },
          ],
        },
      ],
    })
    const step = doc.toJSON().onboarding[0]
    expect(step.screenId).toBe('PICK_CREDENTIAL')
    expect(step.issuer_name).toBe('Best BC College')
    expect(step.credentials[0].attributes[0].value).toBe('12345')
  })
})

describe('ProgressBarStep embedded schema', () => {
  it('persists progress bar steps', async () => {
    const doc = await CharacterModel.create({
      ...minimal,
      type: 'Student-progress',
      progressBar: [
        { name: 'person', onboardingStep: 'PICK_CHARACTER', iconLight: '/light.svg', iconDark: '/dark.svg' },
      ],
    })
    const step = doc.toJSON().progressBar[0]
    expect(step.name).toBe('person')
    expect(step.onboardingStep).toBe('PICK_CHARACTER')
  })
})

describe('RevocationInfoItem embedded schema', () => {
  it('persists revocation info', async () => {
    const doc = await CharacterModel.create({
      ...minimal,
      type: 'Student-revocation',
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

describe('UseCase embedded in Character', () => {
  it('persists use cases with screens', async () => {
    const doc = await CharacterModel.create({
      ...minimal,
      type: 'Student-usecase',
      useCases: [
        {
          id: 'clothesOnline',
          name: 'Clothes Online',
          screens: [{ screenId: 'START', name: 'Welcome', text: 'Begin the demo' }],
        },
      ],
    })
    const uc = doc.toJSON().useCases[0]
    expect(uc.id).toBe('clothesOnline')
    expect(uc.screens[0].screenId).toBe('START')
  })
})
