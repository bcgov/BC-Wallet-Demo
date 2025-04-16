import { pgEnum } from 'drizzle-orm/pg-core'
import { StepType } from '../../types'

export const StepTypePg = pgEnum('StepType', Object.values(StepType) as [string, ...string[]])
