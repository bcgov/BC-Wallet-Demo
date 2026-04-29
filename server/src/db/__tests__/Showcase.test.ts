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
    expect(json.hidden).toBe(false)
  })

  it('rejects a showcase with a missing required field', async () => {
    await expect(ShowcaseModel.create({ name: 'Student Showcase' })).rejects.toThrow()
  })

  it('enforces unique index on persona.type', async () => {
    await ShowcaseModel.create({ ...minimal, persona: { ...minimal.persona, type: 'UniqueType' } })
    await expect(
      ShowcaseModel.create({ name: 'Other Showcase', persona: { name: 'Bob', type: 'UniqueType', image: '/b.svg' } }),
    ).rejects.toThrow()
  })
})

describe('IntroductionStep embedded schema', () => {
  it('persists an introduction step with credentialNames and top-level credentials', async () => {
    const doc = await ShowcaseModel.create({
      ...minimal,
      persona: { ...minimal.persona, type: 'Student-introduction' },
      credentials: [
        {
          schema_id: 'QEquAHkM35w4XVT3Ku5yat:2:student_card:1.6',
          name: 'Student Card',
          icon: '/icon.svg',
          version: '1.0',
          attributes: [{ name: 'student_id', value: '12345' }],
        },
      ],
      introduction: [
        {
          screenId: 'PICK_CREDENTIAL',
          name: 'Get your card',
          text: 'Scan to receive',
          issuer_name: 'Best BC College',
          credentialSchemaIds: ['QEquAHkM35w4XVT3Ku5yat:2:student_card:1.6'],
        },
      ],
    })
    const json = doc.toJSON()
    const step = json.introduction[0]
    expect(step.screenId).toBe('PICK_CREDENTIAL')
    expect(step.issuer_name).toBe('Best BC College')
    expect(step.credentialSchemaIds[0]).toBe('QEquAHkM35w4XVT3Ku5yat:2:student_card:1.6')
    expect(json.credentials[0].attributes[0].value).toBe('12345')
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
