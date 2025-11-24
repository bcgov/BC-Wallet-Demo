require('dotenv-flow').config()

import 'reflect-metadata'
import * as process from 'node:process'
import { createExpressServer, useContainer } from 'routing-controllers'
import Container from 'typedi'

import ApprovalController from './controllers/ApprovalController'
import AssetController from './controllers/AssetController'
import { CredentialDefinitionController } from './controllers/CredentialDefinitionController'
import { CredentialSchemaController } from './controllers/CredentialSchemaController'
import { HealthController } from './controllers/HealthController'
import IssuanceScenarioController from './controllers/IssuanceScenarioController'
import IssuerController from './controllers/IssuerController'
import { JobStatusController } from './controllers/JobStatusController'
import PersonaController from './controllers/PersonaController'
import PresentationScenarioController from './controllers/PresentationScenarioController'
import RelyingPartyController from './controllers/RelyingPartyController'
import ShowcaseController from './controllers/ShowcaseController'
import TenantController from './controllers/TenantController'
import { ExpressErrorHandler } from './middleware/ExpressErrorHandler'
import { RequestContextMiddleware } from './middleware/RequestContextMiddleware'
import { registerServicesByInterface } from './services/RegisterServicesByInterface'
import TenantService from './services/TenantService'
import { authorizationChecker } from './utils/auth'
import { corsOptions } from './utils/cors'
import { logger } from './utils/logger'

useContainer(Container)

async function bootstrap() {
  try {
    logger.info('Starting BC Wallet API Server...')

    logger.info('Registering services by interface...')
    await registerServicesByInterface()
    logger.info('Services registered successfully')

    // Create and configure Express server with routing-controllers
    logger.info('Creating Express server with routing controllers...')
    const app = createExpressServer({
      controllers: [
        AssetController,
        PersonaController,
        CredentialSchemaController,
        CredentialDefinitionController,
        RelyingPartyController,
        IssuerController,
        IssuanceScenarioController,
        PresentationScenarioController,
        ShowcaseController,
        TenantController,
        ApprovalController,
        JobStatusController,
        HealthController,
      ],
      authorizationChecker,
      middlewares: [RequestContextMiddleware, ExpressErrorHandler],
      defaultErrorHandler: false,
      cors: corsOptions,
    })
    
    logger.info('Express server created successfully')

    logger.info('Creating root tenant...')
    const tenantService = Container.get(TenantService)
    void (await tenantService.createRootTenant())
    logger.info('Root tenant created successfully')

    // Start the server
    const port = Number(process.env.PORT)
    logger.info({ port }, 'Starting server...')

    app.listen(port, (): void => {
      logger.info({ port }, `BC Wallet API Server is running on port ${port}`)
    })
  } catch (error) {
    logger.error({ error }, 'Failed to start BC Wallet API Server')
    process.exit(1)
  }
}

// Start the application
void bootstrap()
