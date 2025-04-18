import { PGlite } from '@electric-sql/pglite'
import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq'
import { AdapterClientApi } from 'bc-wallet-adapter-client-api'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/pglite'
import Container from 'typedi'

import { createMockDatabaseService } from '../../database/repositories/__tests__/dbTestData'
import * as schema from '../../database/schema'
import DatabaseService from '../../services/DatabaseService'
import { MockSessionService } from './MockSessionService'

export async function registerMockServicesByInterface(database: NodePgDatabase) {
  const oidcSessionService = Container.get(MockSessionService)
  Container.set('ISessionService', oidcSessionService)
  const adapterClientApi = Container.get(AdapterClientApi)
  Container.set('IAdapterClientApi', adapterClientApi)
  const mockDatabaseService = await createMockDatabaseService(database)
  Container.set(DatabaseService, mockDatabaseService)
}

declare global {
  var rabbitMQContainer: StartedRabbitMQContainer | undefined
}

export async function setupTestDatabase(): Promise<{ client: PGlite; database: NodePgDatabase }> {
  const client = new PGlite()
  const database = drizzle(client, { schema }) as unknown as NodePgDatabase
  await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
  return { client, database }
}

export async function setupRabbitMQ() {
  if (!global.rabbitMQContainer) {
    global.rabbitMQContainer = await new RabbitMQContainer('rabbitmq:4').start()

    process.env.AMQ_HOST = global.rabbitMQContainer.getHost()
    process.env.AMQ_PORT = `${global.rabbitMQContainer.getMappedPort(5672)}`
    process.env.AMQ_TRANSPORT = 'tcp'
    process.env.ENCRYPTION_KEY = 'F5XH4zeMFB6nLKY7g15kpkVEcxFkGokGbAKSPbzaTEwe'
  }

  return global.rabbitMQContainer
}
