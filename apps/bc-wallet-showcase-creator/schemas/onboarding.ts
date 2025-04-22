import { z } from 'zod'

export const onboardingStepFormSchema = z.object({
  type: z.enum(['basic', 'issue', 'wallet', 'connect']),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  text: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  image: z.string().optional(),
  // credentials: z.array(z.string()).optional(),
})

export type OnboardingStepFormData = z.infer<typeof onboardingStepFormSchema>

export const stepTypeSchema = z.object({
  type: z.enum(['basic', 'issue', 'wallet', 'connect']),
})

export type StepTypeData = z.infer<typeof stepTypeSchema>

export const issueStepSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  asset: z.string().optional(),
  // credentials: z.array(z.string()).optional(),
})

export type IssueStepFormData = z.infer<typeof issueStepSchema>

export const basicStepSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  asset: z.any().optional(),
})

export const connectStepSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  asset: z.string().optional(),
  qrCodeTitle: z.string().optional()
})

export const walletStepSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  asset: z.string().optional(),
  id: z.number(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  organization: z.string().min(1, 'Organization is required').max(50, 'Organization must be less than 50 characters'),
  recommended: z.boolean(),
  icon: z.string().url('Icon must be a valid URL'),
  url: z.string().url('URL must be a valid URL'),
  setupTitle2: z.string().min(1, 'Setup title is required').max(100, 'Setup title must be less than 100 characters'),
  setupTitle1: z.string().min(1, 'Setup title is required').max(100, 'Setup title must be less than 100 characters'),
  setupDescription1: z
    .string()
    .min(1, 'Setup description is required')
    .max(500, 'Setup description must be less than 500 characters'),
  setupDescription2: z
    .string()
    .min(1, 'Setup description is required')
    .max(500, 'Setup description must be less than 500 characters'),
  apple: z.string().url('Apple URL must be a valid URL'),
  android: z.string().url('Android URL must be a valid URL'),
  ledgerImage: z.string().url('Ledger image URL must be a valid URL').optional(),
})
export type WalletStepFormData = z.infer<typeof walletStepSchema>
export type BasicStepFormData = z.infer<typeof basicStepSchema>
export type ConnectStepFormData = z.infer<typeof connectStepSchema>

