import 'reflect-metadata'
import type { Express } from 'express'

import { json, static as stx } from 'express'
import * as http from 'http'
import { pinoHttp } from 'pino-http'
import { createExpressServer } from 'routing-controllers'
import { Server } from 'socket.io'

import logger from './utils/logger'
import { tractionApiKeyUpdaterInit, tractionRequest, tractionGarbageCollection } from './utils/tractionHelper'

const baseRoute = process.env.BASE_ROUTE

const controllerPattern = __filename.endsWith('.js') ? '/controllers/*.js' : '/controllers/*.ts'

const app: Express = createExpressServer({
  controllers: [__dirname + controllerPattern],
  cors: true,
  routePrefix: `${baseRoute}/demo`,
})

const server = http.createServer(app)

const ws = new Server(server, {
  cors: {
    origin: true,
  },
  path: `${baseRoute}/demo/socket/`,
})

const socketMap = new Map()
const connectionMap = new Map()

ws.on('connection', (socket) => {
  logger.debug({ socketId: socket.id }, 'WebSocket frontend connected')
  socket.on('subscribe', ({ connectionId }) => {
    if (connectionId) {
      socketMap.set(connectionId, socket)
      connectionMap.set(socket.id, connectionId)
      logger.debug({ socketId: socket.id, connectionId }, 'Socket subscribed to connection')
    }
  })
  socket.on('disconnect', () => {
    const connectionId = connectionMap.get(socket.id)
    connectionMap.delete(socket.id)
    if (connectionId) {
      socketMap.delete(connectionId)
    }
    logger.debug({ socketId: socket.id, connectionId }, 'WebSocket frontend disconnected')
  })
})

const run = async () => {
  await tractionApiKeyUpdaterInit()
  await tractionGarbageCollection()

  app.set('sockets', socketMap)

  app.use(json())
  app.use(
    pinoHttp({
      logger,
      customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
      customErrorMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
      customLogLevel: (_req, res) => {
        if (res.statusCode >= 500) return 'error'
        if (res.statusCode >= 400) return 'warn'
        return 'info'
      },
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    }),
  )

  app.use(`${baseRoute}/public`, stx(__dirname + '/public'))

  app.get(`${baseRoute}/server/last-reset`, async (req, res) => {
    res.send(new Date())
  })

  // Redirect QR code scans for installing bc wallet to the apple or google play store
  const androidUrl = 'https://play.google.com/store/apps/details?id=ca.bc.gov.BCWallet'
  const appleUrl = 'https://apps.apple.com/us/app/bc-wallet/id1587380443'
  app.get(`${baseRoute}/qr`, async (req, res) => {
    const appleMatchers = [/iPhone/i, /iPad/i, /iPod/i]
    let url = androidUrl
    const isApple = appleMatchers.some((item) => req.get('User-Agent')?.match(item))
    if (isApple) {
      url = appleUrl
    }
    res.redirect(url)
    return res
  })

  // respond to health checks for openshift
  app.get('/', async (req, res) => {
    res.send('ok')
    return res
  })

  // respond to ditp health checks
  app.get(`${baseRoute}/server/ready`, async (req, res) => {
    res.json({ ready: true })
    return res
  })

  // respond to ready checks to the traction agent
  app.get(`${baseRoute}/agent/ready`, async (req, res) => {
    const response = await tractionRequest.get(`/status/ready`)
    res.send(response.data)
    return response
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(5000, () => {
      server.off('error', reject)
      resolve()
    })
  })
  logger.info('Server listening on port 5000')
}

run()
