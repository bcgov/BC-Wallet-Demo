import 'dotenv/config'

import type { SeedCredential } from '../src/utils/tractionHelper'

import mongoose from 'mongoose'

import credentialsSeed from '../migrations/values/credentials.json'
import showcases, { allCredentials } from '../src/content/Showcases'
import { connectDB } from '../src/db/connection'
import { CredentialModel } from '../src/db/models/Credential'
import { ShowcaseModel } from '../src/db/models/Showcase'
import logger from '../src/utils/logger'
import { generateUniqueSlug, slugify } from '../src/utils/slug'
import {
  ensureDidInDatabase,
  getOrCreateIndyDid,
  getOrCreateWebvhDid,
  populateMissingSchemaDids,
  processSeededCredential,
  tractionApiKeyUpdaterInit,
} from '../src/utils/tractionHelper'

export async function runSeed(): Promise<void> {
  await tractionApiKeyUpdaterInit(true)
  const credResults = await Promise.all(
    allCredentials.map((cred) =>
      CredentialModel.findOneAndUpdate(
        { _id: cred._id },
        { $setOnInsert: cred },
        { upsert: true, returnDocument: 'after' },
      ),
    ),
  )

  logger.info({ count: credResults.length }, 'Seeded credentials')

  const showcaseResults = []
  for (const s of showcases) {
    if (!s.slug) {
      s.slug = await generateUniqueSlug(slugify(s.name), (candidate) =>
        ShowcaseModel.exists({ slug: candidate }).then(Boolean),
      )
    }
    const result = await ShowcaseModel.findOneAndUpdate(
      { 'persona.type': s.persona?.type },
      { $setOnInsert: s },
      { upsert: true, returnDocument: 'after' },
    )
    showcaseResults.push(result)
  }

  logger.info({ count: showcaseResults.length }, 'Seeded showcases')

  const indyDid = await getOrCreateIndyDid()
  const webvhDid = await getOrCreateWebvhDid()

  await ensureDidInDatabase(indyDid, 'indy')
  await ensureDidInDatabase(webvhDid, 'webvh')

  for (const credential of credentialsSeed as SeedCredential[]) {
    await processSeededCredential(credential, indyDid)
  }

  await populateMissingSchemaDids(indyDid)
}

if (require.main === module) {
  connectDB()
    .then(runSeed)
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'Seed failed')
      process.exit(1)
    })
}
