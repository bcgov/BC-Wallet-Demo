import 'dotenv/config'

import mongoose from 'mongoose'

import showcases, { allCredentials } from '../src/content/Showcases'
import { connectDB } from '../src/db/connection'
import { CredentialModel } from '../src/db/models/Credential'
import { ShowcaseModel } from '../src/db/models/Showcase'
import logger from '../src/utils/logger'

export async function runSeed(): Promise<void> {
  const credResults = await Promise.all(
    allCredentials.map((cred) =>
      CredentialModel.findOneAndUpdate(
        { _id: cred._id },
        { $set: cred },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        },
      ),
    ),
  )

  logger.info(
    {
      credentialIds: credResults.map((r) => r?._id).filter(Boolean),
      count: credResults.length,
    },
    'Seeded credentials',
  )

  const results = await Promise.all(
    showcases.map((showcase) =>
      ShowcaseModel.findOneAndUpdate(
        { 'persona.type': showcase.persona.type },
        { $set: showcase },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        },
      ),
    ),
  )

  logger.info(
    {
      showcaseTypes: results.map((r) => r?.persona.type).filter(Boolean),
      count: results.length,
    },
    'Seeded showcases',
  )
}

if (require.main === module) {
  connectDB()
    .then(runSeed)
    .then(() => mongoose.disconnect())
    .catch((err) => {
      logger.error({ err }, 'Seed failed')
      process.exit(1)
    })
}
