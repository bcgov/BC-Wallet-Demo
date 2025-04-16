import { z } from "zod";

export const characterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  description: z.string().min(1, "Description is required"),
  hidden: z.boolean().optional(),
  slug: z.string().optional()
});
