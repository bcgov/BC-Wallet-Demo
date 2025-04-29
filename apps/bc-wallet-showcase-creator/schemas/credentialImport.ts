import { z } from "zod";

// Define the schema for the credential import form
export const credentialSchema = z.object({
  credentialId: z.string().min(1, "Credential ID is required"),
  schemaId: z.string().min(1, "Schema ID is required"),
});

// Infer the type from the schema
export type CredentialImportFormData = z.infer<typeof credentialSchema>;
