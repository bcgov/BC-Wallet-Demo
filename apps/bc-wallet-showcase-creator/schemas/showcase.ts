import { ShowcaseStatus } from "bc-wallet-openapi";
import { z } from "zod";

export const showcaseRequestFormData = z.object({
  name: z.string().min(1, "Showcase name is required").max(50, "Showcase name cannot exceed 50 characters"),
  description: z.string().min(1, "Description is required").max(200, "Showcase description cannot exceed 200 characters"),
  completionMessage: z.string().max(100, "Completion message cannot exceed 100 characters").optional(),
  status: z.nativeEnum(ShowcaseStatus).optional().default(ShowcaseStatus.Active),
  hidden: z.boolean().optional().default(false),
  scenarios: z.array(z.string()).optional(),
  credentialDefinitions: z.array(z.string()).optional(),
  personas: z.array(z.string()).optional(),
  tenantId: z.string().min(1, "Tenant ID is required"),
  bannerImage: z.string().min(1, "Banner image is required"),
})
