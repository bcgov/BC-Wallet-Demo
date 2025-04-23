import { AcceptCredentialAction, PresentationScenarioRequest, AriesOOBAction, StepAction, ChooseWalletAction, IssuanceScenarioRequest, StepRequest, StepType, AriesOOBActionRequest, SetupConnectionAction, ButtonAction, StepActionRequest, ChooseWalletActionRequest, SetupConnectionActionRequest, ButtonActionRequest, AcceptCredentialActionRequest, CredentialDefinition } from "bc-wallet-openapi";


export type StepActionTypes =
  | StepAction
  | AcceptCredentialAction
  | ButtonAction
  | AriesOOBAction
  | SetupConnectionAction
  | ChooseWalletAction


export type StepActionRequestTypes =
| StepActionRequest
| AcceptCredentialActionRequest
| ButtonActionRequest
| AriesOOBActionRequest
| SetupConnectionActionRequest
| ChooseWalletActionRequest
  
export interface StepRequestUIActionTypes extends StepRequest {
  actions: StepActionRequest[];
  credentials?: CredentialDefinition[];
}

// StepActionRequest

export const sampleAction: AriesOOBActionRequest =  {
  title: "example_title",
  actionType: "ARIES_OOB" as "ARIES_OOB",
  text: "example_text",
  proofRequest: {
    attributes: {},
    predicates: {},
  },
  credentialDefinitionId: ""
}

export const sampleScenario: IssuanceScenarioRequest | PresentationScenarioRequest = {
  name: "example_name",
  description: "example_description",
  issuer: "3de59a17-222e-4c92-a22a-118eff7032b5",
  steps: [],
  personas: [],
};

export const createDefaultStep = ({
  title,
  description,
  asset = "",
}: {
  title: string;
  description: string;
  asset?: string;
}): StepRequest => ({
  title,
  description,
  order: 0,
  type: "HUMAN_TASK",
  actions: [
    sampleAction,
  ],
  // subScenario: "",
  asset,
});

export const createAdvancedStep = ({
  title,
  description,
  asset = "",
  credentials = [],
  actions = [],
  type = StepType.Service,
}: {
  title: string;
  description: string;
  asset?: string;
  credentials?: CredentialDefinition[];
  actions?: StepActionRequestTypes[];
  type?: StepType;
}): StepRequest => ({
  title,
  description,
  order: 0,
  type,
  actions: [
    ...actions,
  ],
  asset,
  // credentials: credentials || [],
});

