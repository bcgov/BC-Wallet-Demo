import { pgEnum } from 'drizzle-orm/pg-core'
import { CredentialType } from '../../types'

export const CredentialTypePg = pgEnum('CredentialType', Object.values(CredentialType) as [string, ...string[]])
