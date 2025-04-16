import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { Service } from 'typedi'

import * as schema from '../database/schema'

const path = require('path')

@Service()
export class DatabaseService {
  private db?: NodePgDatabase<typeof schema>

  private getDbUrl(): string {
    return (
      process.env.DB_URL ??
      `postgresql://${process.env.DB_USERNAME}${process.env.DB_PASSWORD && `:${process.env.DB_PASSWORD}`}${process.env.DB_HOST && `@${process.env.DB_HOST}`}${process.env.DB_PORT && `:${process.env.DB_PORT}`}/${process.env.DB_NAME}`
    )
  }

  public async getConnection(): Promise<NodePgDatabase<typeof schema>> {
    if (!this.db) {
      const pool = new Pool({ connectionString: this.getDbUrl() })
      this.db = drizzle(pool, { schema })

      const migrationsFolder = path.resolve(__dirname, '../database/migrations')
      await migrate(this.db, { migrationsFolder })
    }

    return this.db
  }
}

export default DatabaseService
