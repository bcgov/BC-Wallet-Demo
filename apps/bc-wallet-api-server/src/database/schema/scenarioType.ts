import { pgEnum } from 'drizzle-orm/pg-core'
import { ScenarioType } from '../../types'

export const ScenarioTypePg = pgEnum('ScenarioType', Object.values(ScenarioType) as [string, ...string[]])
