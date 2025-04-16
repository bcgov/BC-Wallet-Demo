import { pgEnum } from 'drizzle-orm/pg-core'
import { Source } from '../../types'

export const SourcePg = pgEnum('Source', Object.values(Source) as [string, ...string[]])
