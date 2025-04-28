import 'reflect-metadata'

import type { Express } from 'express'
import { json, static as stx } from 'express'
import * as http from 'http'
import { createExpressServer } from 'routing-controllers'
import { Server } from 'socket.io'

import { corsOptions } from './utils/cors'
import { tractionApiKeyUpdaterInit, tractionGarbageCollection, tractionRequest } from './utils/tractionHelper'

const baseRoute = process.env.BASE_ROUTE
console.log(`Starting server with BASE_ROUTE: ${baseRoute}`)
console.log(
  `Environment variables loaded: ${JSON.stringify({
    PORT: process.env.PORT,
    BASE_ROUTE: process.env.BASE_ROUTE,
    CORS_DISABLED: process.env.CORS_DISABLED,
  })}`,
)

const app: Express = createExpressServer({
  controllers: [__dirname + '/controllers/**/*{.js,.ts}'],
  cors: corsOptions,
  routePrefix: `${baseRoute}/demo`,
})

const server = http.createServer(app)

const ws = new Server(server, {
  cors: corsOptions,
  path: `${baseRoute}/socket/`,
})

const socketMap = new Map()
const connectionMap = new Map()

ws.on('connection', (socket) => {
  socket.on('subscribe', ({ connectionId }) => {
    if (connectionId) {
      socketMap.set(connectionId, socket)
      connectionMap.set(socket.id, connectionId)
    }
  })
  socket.on('disconnect', () => {
    const connectionId = connectionMap.get(socket.id)
    connectionMap.delete(socket.id)
    if (connectionId) {
      socketMap.delete(connectionId)
    }
  })
})

const run = async () => {
  try {
    console.debug('Initializing Traction API key updater')
    await tractionApiKeyUpdaterInit()
    console.debug('Running Traction garbage collection')
    await tractionGarbageCollection()

    app.set('sockets', socketMap)

    app.use(json())
    console.log(`Setting up static route: ${baseRoute}/public -> ${__dirname}/public`)
    app.use(`${baseRoute}/public`, stx(__dirname + '/public'))

    app.get(`${baseRoute}/server/last-reset`, (req, res) => {
      console.debug(`${req.method} ${req.path} - handling last-reset request`)
      res.send(new Date())
    })

    // Redirect QR code scans for installing bc wallet to the apple or google play store
    const androidUrl = 'https://play.google.com/store/apps/details?id=ca.bc.gov.BCWallet'
    const appleUrl = 'https://apps.apple.com/us/app/bc-wallet/id1587380443'
    app.get(`${baseRoute}/qr`, (req, res) => {
      console.debug(`${req.method} ${req.path} - handling QR redirect`)
      const appleMatchers = [/iPhone/i, /iPad/i, /iPod/i]
      let url = androidUrl
      const isApple = appleMatchers.some((item) => req.get('User-Agent')?.match(item))
      if (isApple) {
        url = appleUrl
      }
      res.redirect(url)
    })

    // respond to healthchecks for openshift
    app.get('/', (_, res) => {
      res.send('ok')
    })

    // respond to ditp health checks
    app.get(`${baseRoute}/server/ready`, (_, res) => {
      res.json({ ready: true })
    })

    // respond to ready checks to the traction agent
    app.get(`${baseRoute}/agent/ready`, async (_, res) => {
      try {
        const response = await tractionRequest.get(`/status/ready`)
        res.send(response.data)
      } catch (error) {
        console.error('Error in agent ready check:', error)
        return Promise.reject(Error('Failed to check agent readiness'))
      }
    })

    const port = process.env.PORT || 3000
    server.listen(port, () => {
      console.log(`Server started on port ${port}`)
      console.log(`Full base URL: http://localhost:${port}${baseRoute}`)
    })
  } catch (error) {
    console.error('Error during server startup:', error)
    process.exit(1)
  }
}

console.log('Starting application...')
void run()
