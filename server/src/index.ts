import 'reflect-metadata'
import type { Express } from 'express'

import { json, static as stx } from 'express'
import * as http from 'http'
import { createExpressServer } from 'routing-controllers'
import { Server } from 'socket.io'

import { tractionApiKeyUpdaterInit, tractionRequest, tractionGarbageCollection } from './utils/tractionHelper'

const app: Express = createExpressServer({
  controllers: [__dirname + '/controllers/**/*.ts'],
  cors: true,
  routePrefix: '/digital-trust/showcase/demo',
})

const server = http.createServer(app)

const ws = new Server(server, {cors:{
  origin:true
}})

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

process.on('unhandledRejection', (error) => {
  if (error instanceof Error) {
    console.error(`Unhandled promise rejection: ${error.message}`, { error })
  } else {
    console.error('Unhandled promise rejection due to non-error error', {
      error,
    })
  }
})

const run = async () => {
  await tractionApiKeyUpdaterInit()
  await tractionGarbageCollection()

  app.set('sockets', socketMap)

  app.use(json())

  app.use('/digital-trust/showcase/public', stx(__dirname + '/public'))

  app.get('/digital-trust/showcase/server/last-reset', async (req, res) => {
    res.send(new Date())
  })

  // Redirect QR code scans for installing bc wallet to the apple or google play store
  const androidUrl = 'https://play.google.com/store/apps/details?id=ca.bc.gov.BCWallet'
  const appleUrl = 'https://apps.apple.com/us/app/bc-wallet/id1587380443'
  app.get('/digital-trust/showcase/qr', async (req, res) => {
    const appleMatchers = [/iPhone/i, /iPad/i, /iPod/i]
    let url = androidUrl
    const isApple = appleMatchers.some((item) => req.get('User-Agent')?.match(item))
    if (isApple) {
      url = appleUrl
    }
    res.redirect(url)
    return res
  })

  // respond to healthchecks for openshift
  app.get('/', async (req, res) => {
    res.send('ok')
    return res
  })

  // respond to ditp health checks
  app.get('/digital-trust/showcase/server/ready', async (req, res) => {
    res.json({ ready: true })
    return res
  })

  // respond to ready checks to the traction agent
  app.get('/digital-trust/showcase/agent/ready', async (req, res) => {
    const response = await tractionRequest.get(`/status/ready`)
    res.send(response.data)
    return response
  })

  server.listen(5000)
}

run()
