import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq'

import { environment } from '../environment'

declare global {
  var rabbitMQContainer: StartedRabbitMQContainer | undefined
}

export async function setupRabbitMQ(): Promise<StartedRabbitMQContainer> {
  if (!global.rabbitMQContainer) {
    global.rabbitMQContainer = await new RabbitMQContainer('rabbitmq:4').start()

    process.env.AMQ_HOST = global.rabbitMQContainer.getHost()
    environment.messageBroker.AMQ_PORT = global.rabbitMQContainer.getMappedPort(5672)
    process.env.AMQ_PORT = environment.messageBroker.AMQ_PORT.toString()
    process.env.AMQ_TRANSPORT = 'tcp'
    process.env.ENCRYPTION_KEY = environment.encryption.ENCRYPTION_KEY = 'F5XH4zeMFB6nLKY7g15kpkVEcxFkGokGbAKSPbzaTEwe'
  }

  return global.rabbitMQContainer
}
