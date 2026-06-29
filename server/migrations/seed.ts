import 'dotenv/config'

import type { SeedCredential } from '../src/utils/tractionHelper'

import mongoose from 'mongoose'

import credentialsSeed from '../migrations/values/credentials.json'
import showcases, { allCredentials } from '../src/content/Showcases'
import { connectDB } from '../src/db/connection'
import { CredentialModel } from '../src/db/models/Credential'
import { ShowcaseModel } from '../src/db/models/Showcase'
import logger from '../src/utils/logger'
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

  const showcaseResults = await Promise.all(
    showcases.map((s) =>
      ShowcaseModel.findOneAndUpdate(
        { 'persona.type': s.persona?.type },
        { $setOnInsert: s },
        { upsert: true, returnDocument: 'after' },
      ),
    ),
  )

  logger.info({ count: showcaseResults.length }, 'Seeded showcases')

  const indyDid = await getOrCreateIndyDid()
  const webvhDid = await getOrCreateWebvhDid()

  await ensureDidInDatabase(indyDid, 'indy')
  if (webvhDid) {
    await ensureDidInDatabase(webvhDid, 'webvh')
  }

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
