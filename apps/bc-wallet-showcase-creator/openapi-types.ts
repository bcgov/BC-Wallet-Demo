// import { Step, StepRequest, CredentialDefinition } from 'bc-wallet-openapi';
import { z } from 'zod';

export const IdentifierTypeEnum = z.enum(['DID']);
export const SourceEnum = z.enum(['IMPORTED', 'CREATED']);
export const CredentialAttributeTypeEnum = z.enum(['STRING', 'DATE']);
// export const ScenarioTypeEnum = z.enum(['ISSUANCE', 'PRESENTATION']);
// export const StepTypeEnum = z.enum(['HUMAN_TASK', 'SERVICE', 'SCENARIO']);

// Step and related schemas
// export const AriesRequestCredentialAttributes = z.object({
//   attributes: z.array(z.string()).optional(),
//   restrictions: z.array(z.string()).optional(),
// });

// export const AriesRequestCredentialPredicates = z.object({
//   name: z.string(),
//   type: z.string(),
//   value: z.string(),
//   restrictions: z.array(z.string()),
// });

// export const AriesProofRequestRequest = z.object({
//   attributes: z.record(AriesRequestCredentialAttributes),
//   predicates: z.record(AriesRequestCredentialPredicates),
// });

// export const StepActionRequest = z.object({
//   title: z.string(),
//   text: z.string(),
//   actionType: z.string(),
// });

// export const AriesOOBActionRequest = StepActionRequest.extend({
//   proofRequest: AriesProofRequestRequest,
// });


// export const StepRequestSchema = z.object({
//   title: z.string(),
//   description: z.string(),
//   order: z.number().int().min(0),
//   type: StepTypeEnum, // StepType;
//   subScenario: z.string().optional(),
//   actions: z.array(AriesOOBActionRequest), // Fixed: Using direct type instead of z.union with single element
//   asset: z.string().optional(),
//   credentials: z.array(z.string()).optional(),
// });

// // Credential related schemas
// export const CredentialAttribute = z.object({
//   id: z.string(),
//   name: z.string(),
//   value: z.string().optional(),
//   type: CredentialAttributeTypeEnum,
//   createdAt: z.string().datetime(),
//   updatedAt: z.string().datetime(),
// });

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

// export type CredentialAttributeType = z.infer<typeof CredentialAttribute>;
// export type CredentialSchemaFormRequestType = z.infer<typeof CredentialSchemaRequest>;

// export type StepType = Step
// export type CredentialDefinitionType = CredentialDefinition;
