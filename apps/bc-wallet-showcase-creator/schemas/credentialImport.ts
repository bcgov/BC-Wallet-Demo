import { z } from 'zod'

// Define the schema for the credential import form
export const credentialSchema = z.object({
  credentialId: z
    .string()
    .min(1, 'Credential ID is required')
    .regex(
      /^([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{21,22}):3:CL:(([1-9][0-9]*)|([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{21,22}:2:.+:[0-9.]+)):(.+)?$/,
      'Invalid Credential Definition ID format'
    ),
  schemaId: z
    .string()
    .min(1, 'Schema ID is required')
    .regex(
      /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{21,22}:2:.+:[0-9.]+$/,
      'Invalid Schema ID format'
    ),
})

// Infer the type from the schema
export type CredentialImportFormData = z.infer<typeof credentialSchema>

