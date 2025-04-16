import { z } from "zod";

// Define the schema for the credential import form
export const credentialSchema = z.object({
  credentialId: z.string().optional(), // Allow credentialId to be optional
  schemaId: z.string().min(1, "Issuer name is required"), // schemaId is required
  icon: z.string().optional(), // icon is also optional
  proofRequestCheckbox: z.boolean().optional(), // Optional boolean
  issuanceCheckbox: z.boolean().optional(), // Optional boolean
});

// Infer the type from the schema
export type CredentialImportFormData = z.infer<typeof credentialSchema>;
