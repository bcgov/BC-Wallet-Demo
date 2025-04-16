import { RequestType, StepType } from "@/types";
import { z } from "zod";

const scenarioOverviewSchema = z.object({
  title: z.string().min(1, "Title is required"),
  text: z.string().min(1, "Description is required"),
  image: z.string().optional(),
});

const attributeSchema = z.object({
  attributes: z.array(z.string()).min(1, "At least one attribute is required"),
  restrictions: z.array(z.string()).optional(),
});

const predicateSchema = z.object({
  name: z.string(),
  type: z.enum([">=", "<=", "=", "none"]),
  value: z.number(),
  restrictions: z.array(z.string()),
});

export const proofRequestSchema = z.object({
  attributes: z.record(attributeSchema),
  predicates: z.record(predicateSchema),
});

const basicRequestOptionsSchema = z.object({
  type: z.literal(RequestType.BASIC),
  title: z.string(),
  text: z.string(),
  proofRequest: proofRequestSchema,
});

export const basicStepSchema = z.object({
  id: z.string(),
  type: z.literal(StepType.HUMAN_TASK),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requestOptions: basicRequestOptionsSchema,
});

const proofRequestOptionsSchema = z.object({
  type: z.literal(RequestType.OOB),
  title: z.string().min(1, "Title is required"),
  text: z.string().min(1, "Description is required"),
  proofRequest: proofRequestSchema,
});

export const proofStepSchema = z.object({
  id: z.string(),
  type: z.literal(StepType.SERVICE),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requestOptions: proofRequestOptionsSchema,
});

const scenarioStepSchema = z.union([basicStepSchema, proofStepSchema]);

export const scenarioSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  overview: scenarioOverviewSchema,
  summary: scenarioOverviewSchema,
  steps: z.array(scenarioStepSchema),
});

export const PREDICATE_OPTIONS = [
  { value: "none", label: "None" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: "=", label: "=" },
] as const;

export type BasicStepFormData = z.infer<typeof basicStepSchema>;
export type ProofStepFormData = z.infer<typeof proofStepSchema>;
export type ScenarioStepFormData = z.infer<typeof scenarioStepSchema>;
export type ScenarioFormData = z.infer<typeof scenarioSchema>;
export type ProofRequestFormData = z.infer<typeof proofRequestSchema>;