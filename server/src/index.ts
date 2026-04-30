import type { Express } from 'express'
import 'reflect-metadata'

import { json, static as stx } from 'express'
import * as http from 'http'
import mongoose from 'mongoose'
import { pinoHttp } from 'pino-http'
import { createExpressServer } from 'routing-controllers'
import { Server } from 'socket.io'

import { connectDB, registerShutdownHandlers } from './db/connection'
import { requireAdmin } from './middleware/requireAdmin'
import adminCharactersRouter from './routes/adminCharactersRouter'
import adminSvgRouter from './routes/adminSvgRouter'
import logger from './utils/logger'
import { tractionApiKeyUpdaterInit, tractionGarbageCollection, tractionRequest } from './utils/tractionHelper'

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
  await connectDB()
  registerShutdownHandlers()

  await tractionApiKeyUpdaterInit()
  await tractionGarbageCollection()

  app.set('sockets', socketMap)

  // CORS middleware — allows cross-origin requests from frontend during development and testing
  app.use((req, res, next) => {
    const origin = req.headers.origin
    const isDev = process.env.NODE_ENV === 'development'
    const isTest = process.env.NODE_ENV === 'test'

    // In development/test, allow requests from localhost on any port (both 'localhost' and '127.0.0.1')
    // In production, restrict to specific origins
    if ((isDev || isTest) && origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(200)
      return
    }
    next()
  })

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

  // All routes under /admin require a valid Keycloak-issued JWT.
  app.use(`${baseRoute}/admin`, requireAdmin)
  app.use(`${baseRoute}/admin/characters`, adminCharactersRouter)
  app.use(`${baseRoute}/admin/svgs`, adminSvgRouter)

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
    const dbReady = mongoose.connection.readyState === 1
    res.status(dbReady ? 200 : 503).json({ ready: dbReady })
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

run().catch((error: unknown) => {
  logger.error({ err: error }, 'Fatal startup error')
  process.exit(1)
})
