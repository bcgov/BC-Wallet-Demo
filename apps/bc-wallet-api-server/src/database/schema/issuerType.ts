import { pgEnum } from 'drizzle-orm/pg-core'
import { IssuerType } from '../../types'

export const IssuerTypePg = pgEnum('IssuerType', Object.values(IssuerType) as [string, ...string[]])
