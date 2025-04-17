import { z } from 'zod';

export const IdentifierTypeEnum = z.enum(['DID']);
export const SourceEnum = z.enum(['IMPORTED', 'CREATED']);
export const CredentialAttributeTypeEnum = z.enum(['STRING', 'DATE']);

export const CredentialAttributeRequest = z.object({
  name: z.string(),
  value: z.string(),
  type: CredentialAttributeTypeEnum,
});

export const CredentialSchemaRequest = z.object({
  name: z.string(),
  version: z.string(),
  identifierType: IdentifierTypeEnum.optional(),
  source: SourceEnum.optional(),
  identifier: z.string().optional(),
  attributes: z.array(CredentialAttributeRequest).optional(),
});

export type CredentialSchemaFormRequestType = z.infer<typeof CredentialSchemaRequest>;
