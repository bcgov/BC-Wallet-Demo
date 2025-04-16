import { pgEnum } from 'drizzle-orm/pg-core'
import { IdentifierType } from '../../types'

export const IdentifierTypePg = pgEnum('IdentifierType', Object.values(IdentifierType) as [string, ...string[]])
