import { z } from "zod";

const attributeSchema = z.object({
  attributes: z.array(z.string()).min(1, "At least one attribute is required"),
  restrictions: z.array(z.string()).optional(),
});

const predicateValueSchema = z.object({
  name: z.string(),
  type: z.enum([">=", "<=", "none"]),
  value: z.number(),
  restrictions: z.array(z.string()).optional(),
})

const predicateSchema = z.object({
  predicates: z.array(predicateValueSchema).optional(),
});

export const proofRequestSchema = z.object({
  attributes: z.record(attributeSchema),
  predicates: z.record(predicateSchema).optional(),
});


export const PREDICATE_OPTIONS = [
  { value: "none", label: "None" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
] as const;

export type ProofRequestFormData = z.infer<typeof proofRequestSchema>;