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
  actions: StepActionRequestTypes[];
  credentials?: CredentialDefinition[];
}

// StepActionRequest

export const sampleAction: AriesOOBActionRequest =  {
  title: "example_title",
  actionType: "ARIES_OOB" as "ARIES_OOB",
  text: "example_text",
  proofRequest: {
    attributes: {
      attribute1: {
        attributes: ["attribute1", "attribute2"],
        restrictions: ["restriction1", "restriction2"],
      },
    },
    predicates: {
      predicate1: {
        name: "example_name",
        type: "example_type",
        value: "example_value",
        restrictions: ["restriction1", "restriction2"],
      },
    },
  },
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

export const createServiceStep = ({
  title,
  description,
  asset = "",
  credentials = [],
  actions = []
}: {
  title: string;
  description: string;
  asset?: string;
  credentials?: CredentialDefinition[];
  actions?: StepActionRequestTypes[];
}): StepRequest => ({
  title,
  description,
  order: 0,
  type: StepType.Service,
  actions: [
    ...actions,
  ],
  asset,
  // credentials: credentials || [],
});

