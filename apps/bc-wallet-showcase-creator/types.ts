import { AcceptCredentialActionRequest, AriesOOBActionRequest, AriesProofRequestRequest, Asset, ButtonActionRequest, ChooseWalletActionRequest, CredentialDefinition, Persona, SetupConnectionActionRequest, StepActionRequest, StepActionType, StepRequest } from "bc-wallet-openapi";

export interface ShowcaseJSON {
  personas: Persona[];
}

export type ScenarioStepState = "none-selected" | "adding-step" | "basic-step-edit" | "proof-step-edit" | "editing-scenario" | "editing-issue" | null;

export type ElementPath = string | [string, string];

export type Locale = "en" | "fr"

export type PageParams = Promise<{ locale: Locale }>

declare module 'bc-wallet-openapi' {
  interface StepActionRequest {
    asset?: string;
    proofRequest?: AriesProofRequestRequest;
    credentialDefinitionId?: string;
    connectionId?: string;
    goToStep?: string;
  }

  interface StepAction {
    id: string;
    actionType: StepActionType;
    title: string;
    text: string;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    credentialDefinitionId?: string;
    asset?: Asset;
  }
}

type ExtendedChooseWalletActionRequest = ChooseWalletActionRequest & {
  setupTitle?: string;
  setupDescription1?: string;
  setupTitle2?: string;
  setupDescription2?: string;
  apple?: string;
  android?: string;
  ledgerImage?: string;
};

type ExtendedSetupConnectionActionRequest = SetupConnectionActionRequest & {
  qrCodeTitle?: string;
};

type ExtendedAriesOOBActionRequest = AriesOOBActionRequest & {
};

export type StepActionRequestUnion = 
  | ExtendedAriesOOBActionRequest
  | AcceptCredentialActionRequest
  | ButtonActionRequest
  | ExtendedChooseWalletActionRequest
  | ExtendedSetupConnectionActionRequest;

export type UICredentialDefinition = Omit<CredentialDefinition, 'icon'> & {
  icon: string;
} 

export interface Screen extends StepRequest {
  id: string
  credentialDefinitionIds?: string[]
}