import { pgEnum } from 'drizzle-orm/pg-core'
import { CredentialAttributeType } from '../../types'

export const CredentialAttributeTypePg = pgEnum('CredentialAttributeType', Object.values(CredentialAttributeType) as [string, ...string[]])
