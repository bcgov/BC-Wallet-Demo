import { Get, JsonController } from 'routing-controllers'
import { tractionRequest } from '../utils/tractionHelper'

@JsonController('/health')
export class HealthController {
  @Get()
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'bc-wallet-demo-server',
    }
  }

  @Get('/ready')
  async getReady() {
    try {
      // Check if the server can reach Traction agent
      const response = await tractionRequest.get('/status/ready')
      return {
        ready: true,
        timestamp: new Date().toISOString(),
        service: 'bc-wallet-demo-server',
        dependencies: {
          traction: response.data,
        },
      }
    } catch (error) {
      return {
        ready: false,
        timestamp: new Date().toISOString(),
        service: 'bc-wallet-demo-server',
        error: 'Failed to reach Traction agent',
      }
    }
  }

  @Get('/live')
  async getLive() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      service: 'bc-wallet-demo-server',
    }
  }
}
