import { pgEnum } from 'drizzle-orm/pg-core'
import { ShowcaseStatus } from '../../types'

export const showcaseStatusPg = pgEnum('ShowcaseStatus', Object.values(ShowcaseStatus) as [string, ...string[]])
