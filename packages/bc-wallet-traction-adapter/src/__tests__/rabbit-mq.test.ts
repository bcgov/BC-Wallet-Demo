import type { StartedRabbitMQContainer } from '@testcontainers/rabbitmq'
import { RabbitMQContainer } from '@testcontainers/rabbitmq'
import type { Receiver, ReceiverOptions, Sender, SenderOptions } from 'rhea-promise'
import { Connection, ReceiverEvents } from 'rhea-promise'

describe('RabbitMQ Hello World Test', () => {
  jest.setTimeout(60000) // Extend timeout for container startup

  let container: StartedRabbitMQContainer
  let connection: Connection
  let sender: Sender
  let receiver: Receiver

  beforeAll(async () => {
    // Start the RabbitMQ container
    container = await new RabbitMQContainer('rabbitmq:4.0.6').start()

    // Establish an AMQP connection
    connection = new Connection({
      hostname: container.getHost(),
      port: container.getMappedPort(5672),
      transport: 'tcp', // or 'tls' if using SSL
      reconnect: true,
      username: 'guest', // default RabbitMQ username
      password: 'guest', // default RabbitMQ password
    })
    await connection.open()

    // Create a sender
    const senderOptions: SenderOptions = {
      target: { address: 'test-queue' },
    }
    sender = await connection.createSender(senderOptions)

    // Create a receiver
    const receiverOptions: ReceiverOptions = {
      source: { address: 'test-queue' },
    }
    receiver = await connection.createReceiver(receiverOptions)
  })

  afterAll(async () => {
    // Close AMQP entities and stop the container
    await sender.close()
    await receiver.close()
    await connection.close()
    await container.stop()
  })

  test('should send and receive a message', async () => {
    const messageBody = 'Hello World'

    // Set up a promise to handle message reception
    const receivedMessage = new Promise<string>((resolve, reject) => {
      receiver.on(ReceiverEvents.message, (context) => {
        if (context.message) {
          const receivedBody = context.message.body as string
          resolve(receivedBody)
        } else {
          reject(new Error('Received message is undefined'))
        }
      })

      receiver.on(ReceiverEvents.receiverError, (context) => {
        reject(context.receiver?.error || Error('Receiver encountered an error'))
      })
    })

    // Send the message
    sender.send({
      body: messageBody,
    })

    // Wait for the message to be received
    const result = await receivedMessage
    expect(result).toBe(messageBody)
    console.log('result', result)
  })
})
