import { MessageProcessor } from './message-processor'
import { environment } from './environment'

async function main() {
  const processor = new MessageProcessor(environment.messageBroker.MESSAGE_PROCESSOR_TOPIC)

  try {
    await processor.start()
    console.log('AMQ 1.0 message processor started')

    process.on('SIGINT', async () => {
      console.log('Received SIGINT. Shutting down...')
      await processor.stop()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM. Shutting down...')
      await processor.stop()
      process.exit(0)
    })

    process.stdin.resume()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

void main()
