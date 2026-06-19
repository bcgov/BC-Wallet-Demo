import { CredentialModel } from '../src/db/models/Credential'
import { ShowcaseModel } from '../src/db/models/Showcase'

export async function up() {
  const showcases = await ShowcaseModel.find()

  for (const showcase of showcases) {
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
          }
        }
      }
    }
    // Save the showcase after updating all its scenarios
    await showcase.save()
  }
}
