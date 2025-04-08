import { ReactNode} from "react";

export enum StepType {
  BASIC = "BASIC",
  SERVICE = "SERVICE",
  HUMAN_TASK = "HUMAN_TASK"
}

export enum RequestType {
  BASIC = "BASIC",
  OOB = "OOB"
}

export interface Attribute {
  name: string;
  value: string;
  type?: string;
  
}

export interface Credential {
  issuer_name: string;
  name: string;
  version: string;
  icon: string;
  attributes: Attribute[];
}

export interface Credentials {
  [key: string]: Credential;
}

interface RevocationInfo {
  credentialName: string;
  credentialIcon: string;
  title: string;
  description: string;
}

interface ProgressBarItem {
  name: string;
  onboardingStep: string;
  iconLight: string;
  iconDark: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  image?: string;
  credentials?: string[];
}

export interface ProofRequestAttributes {
  attributes: string[];
  restrictions?: string[];
}

export interface ProofRequestPredicates {
  name: string;
  type: string;
  value: number;
  restrictions: string[];
}

export interface ProofRequest {
  attributes: {
    [key: string]: ProofRequestAttributes;
  };
  predicates: {
    [key: string]: ProofRequestPredicates;
  };
}

export interface RequestOptions {
  type: RequestType;
  title: string;
  text: string;
  proofRequest: ProofRequest;
}

export interface ScenarioStep {
  id: string;
  type: StepType.BASIC | StepType.SERVICE | StepType.HUMAN_TASK
  title: string;
  description: string;
  requestOptions: RequestOptions;
}

export interface ScenarioOverview {
  title: string;
  text: string;
  image: string;
}

export interface Scenario {
  id: string;
  name: string;
  status?: 'draft' | 'published' | 'archived';
  overview: ScenarioOverview;
  summary: ScenarioOverview;
  steps: ScenarioStep[];
}

export interface Persona {
  name: string;
  type: string;
  headshot_image: string;
  body_image: string;
  description: string;
  credentials: Credentials;
  revocationInfo: RevocationInfo[];
  progressBar: ProgressBarItem[];
  onboarding: OnboardingStep[];
  scenarios: Scenario[];
}

export interface ShowcaseJSON {
  personas: Persona[];
}

export type CredentialElement = [Exclude<keyof Credential, 'attributes'>] | ['attributes', keyof Attribute];
export type ScenarioStepState = "none-selected" | "adding-step" | "basic-step-edit" | "proof-step-edit" | "editing-scenario" | "editing-issue" | null;

export type ElementPath = string | [string, string];

export type Locale = "en" | "fr"

export type PageParams = Promise<{ locale: Locale }>
