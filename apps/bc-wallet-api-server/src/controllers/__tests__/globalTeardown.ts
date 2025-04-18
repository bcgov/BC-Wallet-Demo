import { StartedRabbitMQContainer } from '@testcontainers/rabbitmq'

declare global {
  var rabbitMQContainer: StartedRabbitMQContainer | undefined
}

export default async function () {
  if (global.rabbitMQContainer) {
    console.log('Stopping RabbitMQ')
    await global.rabbitMQContainer.stop()
    global.rabbitMQContainer = undefined
  }
}
