import { ExtractTablesWithRelations } from 'drizzle-orm'
import { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import { PgTransaction } from 'drizzle-orm/pg-core'

import * as schema from '../../database/schema'

export type RepositoryDefinition<T, U> = {
  findById(id: string): Promise<T>
  findAll(filter?: Record<string, any>): Promise<T[]>
  create(item: U): Promise<T>
  update(id: string, item: U): Promise<T>
  delete(id: string): Promise<void>
}

export type TenantScopedRepositoryDefinition<T, U> = {
  findById(id: string, tenantId?: string): Promise<T>
  findAll(tenantId: string): Promise<T[]>
  create(item: U): Promise<T>
  update(id: string, item: U): Promise<T>
  delete(id: string): Promise<void>
}

export type Tx = PgTransaction<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>
