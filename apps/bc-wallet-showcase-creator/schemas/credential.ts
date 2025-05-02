import { z } from "zod";

export const schemaAttribute = z.object({
  id: z.string().min(1, "Attribute ID is required"), // Unique ID for the attribute
  name: z.string().min(1, "Attribute name is required"), // Name of the attribute
	type: z.enum(["STRING", "DATE"]).default("STRING"),// Type of the attribute
  createdAt: z.string().min(1, "Creation timestamp is required"), // Date the attribute was created
  updatedAt: z.string().min(1, "Update timestamp is required"), // Date the attribute was last updated
});

export const schema = z.object({
  name: z.string().min(1, "Credential name is required"),
	version: z
		.string()
		.trim()
		.regex(/^v?\d+\.\d+(\.\d+)?$/, "Version must be like 1.0, 1.0.1, v1.0, or v1.0.1"),
  attributes: z.array(
    z.object({
      name: z.string().min(1, "Attribute name is required"),
			type: z.enum(["STRING", "DATE"]).default("STRING"),

    })
  ),
});
export const asset = z.object({
  id: z.string().min(1), // Unique identifier for the asset
  mediaType: z.string().min(1), // Media type, e.g., "image/jpeg"
  content: z.string().min(1), // Base64-encoded content of the asset
  fileName: z.string().min(1), // Name of the file, e.g., "asset.jpg"
  description: z.string().min(1), // Description of the asset
  createdAt: z.string().min(1), // Creation date (ISO format)
  updatedAt: z.string().min(1), // Update date (ISO format)
});

// Main schema for SchemaData
export const credentialSchema = z.object({
	id: z.string().min(1),
  identifierType: z.string().min(1),
  identifier: z.string().min(1),
	name: z.string().min(1),
	attributes: z.array(schemaAttribute),
  version: z.string().min(1),
});

// Revocation schema
export const revocation = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	description: z.string().min(1),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
});

// Representation schema
export const credentialRepresentation = z.object({
	id: z.string().min(1),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
	credDefId: z.string().min(1),
	schemaId: z.string().min(1),
	ocaBundleUrl: z.string().url().optional(),
});

// Issuer schema
export const issuer = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	type: z.string().min(1),
	organization: z.string().optional(),
	logo: z.string().optional(),
});

// Icon schema (previously embedded in credentialDefinitionSchema)
export const credentialIcon = z.object({
	id: z.string().min(1),
	mediaType: z.string().min(1),
	content: z.string().min(1), // Base64 encoded data
	fileName: z.string().min(1),
	description: z.string().min(1),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
});

// Updated Credential Definition Schema with assetId
export const credentialDefinition = z.object({
	id: z.string().min(1),
	name: z.string().min(1, "Credential name is required"),
	schemaId: z.string().min(1),
	identifierType: z.string().min(1),
	identifier: z.string().min(1),
	version: z.string().optional(),
	type: z.string().optional(),
	assetId: z.string().min(1, "Asset ID is required"), // ✅ Added assetId here
	representations: z.array(credentialRepresentation),
	revocation: revocation,
	credentialSchema: credentialSchema,
	issuer: issuer.optional(),
	createdAt: z.string().min(1),
  icon: credentialIcon.optional(),
	updatedAt: z.string().min(1),
});

// Main schema for the credential definitions list
export const credentialDefinitionsList = z.object({
	credentialDefinitions: z.array(credentialDefinition),
});

// Types
export type SchemaData = z.infer<typeof credentialSchema>;
export type IssuerData = z.infer<typeof issuer>;
export type CredentialFormData = z.infer<typeof credentialDefinition> & {
  assets?: Asset[]; // Add this line to include the assets property
};
export type Asset = z.infer<typeof asset>;

export type CredentialDefinitionsData = z.infer<
	typeof credentialDefinitionsList
>;
