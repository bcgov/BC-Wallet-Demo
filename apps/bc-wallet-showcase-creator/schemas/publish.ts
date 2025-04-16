import { z } from "zod";

export const publishSchema = z.object({
  title: z
    .string()
    .min(1, "Showcase name is required")
    .max(100, "Showcase name must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  showcase_completion_detail: z
    .string()
    .min(1, "Showcase Completion detail is required")
    .max(500, "Showcase Completion detail must be less than 500 characters"),
  image: z.string().optional(),
});

export type PublishFormData = z.infer<typeof publishSchema>;
