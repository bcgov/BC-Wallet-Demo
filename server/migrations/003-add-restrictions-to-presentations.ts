import { CredentialModel } from '../src/db/models/Credential'
import { ShowcaseModel } from '../src/db/models/Showcase'
import logger from '../src/utils/logger'

export async function up() {
  const showcases = await ShowcaseModel.find()
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
      showcase.markModified('scenarios')
      await showcase.save()
    } catch (error) {
      logger.error({ showcase: showcase.name, error }, 'Error processing showcase in migration 003')
      throw error
    }
  }

  logger.info('Migration 003 completed')
}
