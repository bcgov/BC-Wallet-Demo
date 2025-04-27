import { ShowcaseStatus } from "bc-wallet-openapi";
import { z } from "zod";

export const showcaseRequestFormData = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  completionMessage: z.string().optional(),
  status: z.nativeEnum(ShowcaseStatus).optional().default(ShowcaseStatus.Active),
  hidden: z.boolean().optional().default(false),
  scenarios: z.array(z.string()).optional(),
  credentialDefinitions: z.array(z.string()).optional(),
  personas: z.array(z.string()).optional(),
  tenantId: z.string(),
  bannerImage: z.string().min(1, "Banner image is required"),
})
