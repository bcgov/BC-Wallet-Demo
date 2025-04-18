import { AriesProofRequestRequest, CredentialDefinition, Persona } from "bc-wallet-openapi";

export interface ShowcaseJSON {
  personas: Persona[];
}

export type ScenarioStepState = "none-selected" | "adding-step" | "basic-step-edit" | "proof-step-edit" | "editing-scenario" | "editing-issue" | null;

export type ElementPath = string | [string, string];

export type Locale = "en" | "fr"

export type PageParams = Promise<{ locale: Locale }>

declare module 'bc-wallet-openapi' {
  interface StepActionRequest {
    proofRequest?: AriesProofRequestRequest;
    credentialDefinitionId?: string;
  }
}

export type UICredentialDefinition = Omit<CredentialDefinition, 'icon'> & {
  icon: string;
} 