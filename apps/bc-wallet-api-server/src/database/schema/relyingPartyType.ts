import { pgEnum } from 'drizzle-orm/pg-core'
import { RelyingPartyType } from '../../types'

export const RelyingPartyTypePg = pgEnum('RelyingPartyType', Object.values(RelyingPartyType) as [string, ...string[]])
