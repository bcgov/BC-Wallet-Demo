import mongoose from 'mongoose'

import { CredentialModel } from '../src/db/models/Credential'
import { ShowcaseModel } from '../src/db/models/Showcase'
import logger from '../src/utils/logger'

export async function up() {
  // Create a new session to avoid reading stale data from Mongoose's query cache
  // This ensures we get fresh data from MongoDB, which is important in distributed
  // setups where the previous migration (002) just completed
  const session = await mongoose.startSession()

  try {
    const showcases = await ShowcaseModel.find().session(session)
    logger.info(`Migration 003: Processing ${showcases.length} showcases`)

    for (const showcase of showcases) {
      try {
        for (const scenario of showcase.scenarios || []) {
          for (const screen of scenario.screens || []) {
            if (screen.requestOptions?.requestedCredentials) {
              for (const requestedCredential of screen.requestOptions.requestedCredentials) {
                // Look up the credential by name
                const credential = await CredentialModel.findOne({ name: requestedCredential.name })
                if (credential?.schema_id) {
                  requestedCredential.schema_id = credential.schema_id
                }
                if (credential?.cred_def_id) {
                  requestedCredential.cred_def_id = credential.cred_def_id
                }
                if (!credential) {
                  logger.warn(
                    { showcase: showcase.name, credentialName: requestedCredential.name },
                    'Credential not found in database',
                  )
                }
              }
            }
          }
        }
        // Save the showcase after updating all its scenarios
        await showcase.save()
      } catch (error) {
        logger.error({ showcase: showcase.name, error }, 'Error processing showcase in migration 003')
        throw error
      }
    }

    logger.info('Migration 003 completed')
  } finally {
    await session.endSession()
  }
}
