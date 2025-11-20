import { Get, JsonController } from 'routing-controllers'

@JsonController('/health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'bc-wallet-api-server',
    }
  }

  @Get('/ready')
  getReady() {
    return {
      ready: true,
      timestamp: new Date().toISOString(),
      service: 'bc-wallet-api-server',
    }
  }

  @Get('/live')
  getLive() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      service: 'bc-wallet-api-server',
    }
  }
}
