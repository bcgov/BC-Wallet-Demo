import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'http'

export class HealthServer {
  private server: Server | null = null
  private readonly port: number

  constructor(port: number = 8080) {
    this.port = port
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url || ''

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')

    if (url === '/health' && req.method === 'GET') {
      res.statusCode = 200
      res.end(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          service: 'bc-wallet-traction-adapter',
        }),
      )
    } else if (url === '/health/ready' && req.method === 'GET') {
      res.statusCode = 200
      res.end(
        JSON.stringify({
          ready: true,
          timestamp: new Date().toISOString(),
          service: 'bc-wallet-traction-adapter',
        }),
      )
    } else if (url === '/health/live' && req.method === 'GET') {
      res.statusCode = 200
      res.end(
        JSON.stringify({
          alive: true,
          timestamp: new Date().toISOString(),
          service: 'bc-wallet-traction-adapter',
        }),
      )
    } else {
      res.statusCode = 404
      res.end(JSON.stringify({ error: 'Not found' }))
    }
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer((req, res) => this.handleRequest(req, res))
      this.server.listen(this.port, () => {
        console.log(`Health server listening on port ${this.port}`)
        resolve()
      })
    })
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      } else {
        resolve()
      }
    })
  }
}
