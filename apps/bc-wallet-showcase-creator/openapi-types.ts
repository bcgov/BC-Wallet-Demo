import { z } from 'zod';

// Enum types
export const IdentifierTypeEnum = z.enum(['DID']);
export const SourceEnum = z.enum(['IMPORTED', 'CREATED']);
export const IssuerTypeEnum = z.enum(['ARIES']);
export const RelyingPartyTypeEnum = z.enum(['ARIES']);
export const CredentialTypeEnum = z.enum(['ANONCRED']);
export const CredentialAttributeTypeEnum = z.enum(['STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'DATE']);
export const ShowcaseStatusEnum = z.enum(['PENDING', 'ACTIVE', 'ARCHIVED']);
export const ScenarioTypeEnum = z.enum(['ISSUANCE', 'PRESENTATION']);
export const StepTypeEnum = z.enum(['HUMAN_TASK', 'SERVICE', 'SCENARIO']);

// Forward declarations for recursive types
export const AssetSchema: z.ZodType<any> = z.lazy(() => Asset);
export const StepSchema: z.ZodType<any> = z.lazy(() => Step);
export const StepActionSchema: z.ZodType<any> = z.lazy(() => StepAction);
export const IssuerSchema: z.ZodType<any> = z.lazy(() => Issuer);
export const RelyingPartySchema: z.ZodType<any> = z.lazy(() => RelyingParty);
export const CredentialDefinitionSchema: z.ZodType<any> = z.lazy(() => CredentialDefinition);
export const CredentialSchemaSchema: z.ZodType<any> = z.lazy(() => CredentialSchema);
export const CredentialAttributeSchema: z.ZodType<any> = z.lazy(() => CredentialAttribute);
export const CredentialRepresentationSchema: z.ZodType<any> = z.lazy(() => CredentialRepresentation);
export const RevocationInfoSchema: z.ZodType<any> = z.lazy(() => RevocationInfo);
export const ScenarioSchema: z.ZodType<any> = z.lazy(() => Scenario);

// Asset schemas
export const Asset = z.object({
  id: z.string(),
  mediaType: z.string(),
  content: z.string(),
  fileName: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AssetRequest = z.object({
  mediaType: z.string(),
  content: z.string(),
  fileName: z.string().optional(),
  description: z.string().optional(),
});

export const AssetsResponse = z.object({
  assets: z.array(Asset),
});

export const AssetResponse = z.object({
  asset: Asset,
});

// Step and related schemas
export const AriesRequestCredentialAttributes = z.object({
  attributes: z.array(z.string()).optional(),
  restrictions: z.array(z.string()).optional(),
});

export const AriesRequestCredentialPredicates = z.object({
  name: z.string(),
  type: z.string(),
  value: z.string(),
  restrictions: z.array(z.string()),
});

export const AriesProofRequest = z.object({
  attributes: z.record(AriesRequestCredentialAttributes),
  predicates: z.record(AriesRequestCredentialPredicates),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AriesProofRequestRequest = z.object({
  attributes: z.record(AriesRequestCredentialAttributes),
  predicates: z.record(AriesRequestCredentialPredicates),
});

export const StepAction = z.object({
  id: z.string(),
  actionType: z.string(),
  title: z.string(),
  text: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AriesOOBAction = StepAction.extend({
  proofRequest: AriesProofRequest,
});

export const StepActionRequest = z.object({
  title: z.string(),
  text: z.string(),
  actionType: z.string(),
});

export const AriesOOBActionRequest = StepActionRequest.extend({
  proofRequest: AriesProofRequestRequest,
});

export const Step = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number().int().min(0),
  type: StepTypeEnum,
  subScenario: z.string().optional(),
  actions: z.array(StepActionSchema),
  credentialDefinitionIdentifierType: IdentifierTypeEnum.optional(),
  credentialDefinitionIdentifier: z.string().optional(),
  asset: AssetSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const StepRequest = z.object({
  title: z.string(),
  description: z.string(),
  order: z.number().int().min(0),
  type: StepTypeEnum,
  subScenario: z.string().optional(),
  actions: z.array(AriesOOBActionRequest), // Fixed: Using direct type instead of z.union with single element
  credentialDefinitionIdentifierType: IdentifierTypeEnum.optional(),
  credentialDefinitionIdentifier: z.string().optional(),
  asset: z.string().optional(),
});

export const StepsResponse = z.object({
  steps: z.array(Step),
});

export const StepResponse = z.object({
  step: Step,
});

export const StepActionsResponse = z.object({
  actions: z.array(StepActionSchema),
});

export const StepActionResponse = z.object({
  action: StepActionSchema,
});

// Persona schemas
export const PersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  role: z.string(),
  description: z.string(),
  headshotImage: AssetSchema.optional(),
  bodyImage: AssetSchema.optional(),
  hidden: z.boolean().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PersonaRequest = z.object({
  name: z.string(),
  role: z.string(),
  description: z.string().optional(),
  headshotImage: z.string().optional(),
  bodyImage: z.string().optional(),
  hidden: z.boolean().optional(),
});

export const PersonasResponse = z.object({
  personas: z.array(PersonaSchema),
});

export const PersonaResponse = z.object({
  persona: PersonaSchema,
});

// Credential related schemas
export const CredentialAttribute = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string().optional(),
  type: CredentialAttributeTypeEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CredentialAttributeRequest = z.object({
  name: z.string(),
  value: z.string(),
  type: CredentialAttributeTypeEnum,
});

export const CredentialRepresentation = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const OCARepresentation = CredentialRepresentation.extend({
  credDefId: z.string(),
  schemaId: z.string(),
  ocaBundleUrl: z.string().optional(),
});

export const RevocationInfo = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AnonCredRevocation = RevocationInfo.extend({
  registryId: z.string(),
});

export const CredentialSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  identifierType: IdentifierTypeEnum.optional(),
  identifier: z.string().optional(),
  source: SourceEnum.optional(),
  attributes: z.array(CredentialAttribute).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CredentialSchemaRequest = z.object({
  name: z.string(),
  version: z.string(),
  identifierType: IdentifierTypeEnum.optional(),
  source: SourceEnum.optional(),
  identifier: z.string().optional(),
  attributes: z.array(CredentialAttributeRequest).optional(),
});

export const CredentialSchemasResponse = z.object({
  credentialSchemas: z.array(CredentialSchema),
});

export const CredentialSchemaResponse = z.object({
  credentialSchema: CredentialSchema,
});

export const CredentialDefinition = z.object({
  id: z.string(),
  name: z.string(),
  credentialSchema: CredentialSchema,
  identifierType: IdentifierTypeEnum.optional(),
  identifier: z.string().optional(),
  version: z.string(),
  type: CredentialTypeEnum,
  representations: z.array(z.union([CredentialRepresentation, OCARepresentation])).optional(),
  revocation: z.union([RevocationInfo, AnonCredRevocation]).optional(),
  icon: AssetSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CredentialDefinitionRequest = z.object({
  name: z.string(),
  identifierType: IdentifierTypeEnum.optional(),
  identifier: z.string().optional(),
  version: z.string(),
  type: CredentialTypeEnum,
  credentialSchema: z.string(),
  representations: z.array(z.union([CredentialRepresentation, OCARepresentation])).optional(),
  revocation: z.union([RevocationInfo, AnonCredRevocation]).optional(),
  icon: z.string(),
});

export const CredentialDefinitionsResponse = z.object({
  credentialDefinitions: z.array(CredentialDefinition),
});

export const CredentialDefinitionResponse = z.object({
  credentialDefinition: CredentialDefinition,
});

// Issuer & Relying Party schemas
export const Issuer = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: IssuerTypeEnum,
  organization: z.string().optional(),
  logo: AssetSchema.optional(),
  credentialDefinitions: z.array(CredentialDefinition),
  credentialSchemas: z.array(CredentialSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const IssuerRequest = z.object({
  name: z.string(),
  description: z.string(),
  type: IssuerTypeEnum,
  identifierType: IdentifierTypeEnum.optional(),
  identifier: z.string().optional(),
  organization: z.string().optional(),
  logo: z.string().optional(),
  credentialDefinitions: z.array(z.string()),
  credentialSchemas: z.array(z.string()),
});

export const IssuersResponse = z.object({
  issuers: z.array(Issuer),
});

export const IssuerResponse = z.object({
  issuer: Issuer,
});

export const RelyingParty = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: RelyingPartyTypeEnum,
  organization: z.string().optional(),
  logo: AssetSchema.optional(),
  credentialDefinitions: z.array(CredentialDefinition),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const RelyingPartyRequest = z.object({
  name: z.string(),
  type: RelyingPartyTypeEnum,
  description: z.string(),
  organization: z.string().optional(),
  logo: z.string().optional(),
  credentialDefinitions: z.array(z.string()),
});

export const RelyingPartiesResponse = z.object({
  relyingParties: z.array(RelyingParty),
});

export const RelyingPartyResponse = z.object({
  relyingParty: RelyingParty,
});

// Scenario schemas
export const Scenario = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  type: ScenarioTypeEnum,
  steps: z.array(Step),
  personas: z.array(PersonaSchema),
  hidden: z.boolean().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ScenarioRequest = z.object({
  name: z.string(),
  description: z.string(),
  type: ScenarioTypeEnum,
  steps: z.array(StepRequest),
  personas: z.array(z.string()),
  hidden: z.boolean().optional(),
  issuer: z.string().optional(),
});

export const IssuanceScenario = Scenario.extend({
  issuer: Issuer,
});

export const IssuanceScenarioRequest = ScenarioRequest.extend({
  issuer: z.string(),
});

export const IssuanceScenariosResponse = z.object({
  issuanceScenarios: z.array(IssuanceScenario),
});

export const IssuanceScenarioResponse = z.object({
  issuanceScenario: IssuanceScenario,
});

export const PresentationScenario = Scenario.extend({
  relyingParty: RelyingParty,
});

export const PresentationScenarioRequest = ScenarioRequest.extend({
  relyingParty: z.string(),
});

export const PresentationScenariosResponse = z.object({
  presentationScenarios: z.array(PresentationScenario),
});

export const PresentationScenarioResponse = z.object({
  presentationScenario: PresentationScenario,
});

// Showcase schemas
export const ShowcaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  status: ShowcaseStatusEnum,
  hidden: z.boolean(),
  scenarios: z.array(Scenario),
  credentialDefinitions: z.array(CredentialDefinition),
  personas: z.record(z.any()), // The OpenAPI spec has this as an object with items, which is unusual
  bannerImage: AssetSchema.optional(),
  completionMessage: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ShowcaseRequest = z.object({
  name: z.string(),
  description: z.string(),
  status: ShowcaseStatusEnum,
  hidden: z.boolean().default(false),
  scenarios: z.array(z.string()),
  credentialDefinitions: z.array(z.string()),
  personas: z.array(z.string()),
  bannerImage: z.string().optional(),
  completionMessage: z.string().optional(),
});

export const ShowcasesResponse = z.object({
  showcases: z.array(ShowcaseSchema),
});

export const ShowcaseResponse = z.object({
  showcase: ShowcaseSchema,
});

// Error response schemas
export const ErrorResponse = z.object({
  message: z.string(),
});

export type Showcase = z.infer<typeof ShowcaseSchema>;
export type ShowcaseRequestType = z.infer<typeof ShowcaseRequest>;
export type Persona = z.infer<typeof PersonaSchema>;
export type PersonaRequestType = z.infer<typeof PersonaRequest>;
export type Credential = z.infer<typeof CredentialDefinition>;

export type ScenarioRequestType = z.infer<typeof ScenarioRequest>;
export type IssuanceScenarioResponseType = z.infer<typeof IssuanceScenarioResponse>;
export type AssetRequestType = z.infer<typeof AssetRequest>;

export type CredentialAttributeType = z.infer<typeof CredentialAttribute>;
export type CredentialSchemaType = z.infer<typeof CredentialSchema>;

export type CredentialType = z.infer<typeof CredentialDefinition>;
export type AssetResponseType = z.infer<typeof AssetResponse>;
export type CredentialSchemaRequestType = z.infer<typeof CredentialSchemaRequest>;

export type StepRequestType = z.infer<typeof StepRequest>;
export type StepType = z.infer<typeof Step>;

export type PresentationScenarioResponseType = z.infer<typeof PresentationScenarioResponse>;
export type IssuanceScenarioRequestType = z.infer<typeof IssuanceScenarioRequest>;
export type PresentationScenarioRequestType = z.infer<typeof PresentationScenarioRequest>;

export type CredentialDefinitionRequestType = z.infer<typeof CredentialDefinitionRequest>;
export type CredentialDefinitionResponseType = z.infer<typeof CredentialDefinitionResponse>;
export type CredentialSchemaResponseType = z.infer<typeof CredentialSchemaResponse>;
export type CredentialDefinitionType = z.infer<typeof CredentialDefinition>;

