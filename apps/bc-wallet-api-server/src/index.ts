require('dotenv-flow').config()

import 'reflect-metadata'
import * as process from 'node:process'
import { createExpressServer, useContainer } from 'routing-controllers'
import Container from 'typedi'

import ApprovalController from './controllers/ApprovalController'
import AssetController from './controllers/AssetController'
import { CredentialDefinitionController } from './controllers/CredentialDefinitionController'
import { CredentialSchemaController } from './controllers/CredentialSchemaController'
import IssuanceScenarioController from './controllers/IssuanceScenarioController'
import IssuerController from './controllers/IssuerController'
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

useContainer(Container)

async function bootstrap() {
  try {
    await registerServicesByInterface()

    // Create and configure Express server
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
      ],
      authorizationChecker,
      middlewares: [RequestContextMiddleware, ExpressErrorHandler],
      defaultErrorHandler: false,
      cors: corsOptions,
    })

    const tenantService = Container.get(TenantService)
    tenantService.createRootTenant()

    // Start the server
    const port = Number(process.env.PORT)

    app.listen(port, (): void => {
      console.log(`Server is running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start application:', error)
    process.exit(1)
  }
}

// Start the application
void bootstrap()
