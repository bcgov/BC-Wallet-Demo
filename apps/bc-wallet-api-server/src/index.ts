import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import Container from 'typedi'

import { ExpressErrorHandler } from './middleware/ExpressErrorHandler'
import AssetController from './controllers/AssetController'
import PersonaController from './controllers/PersonaController'
import RelyingPartyController from './controllers/RelyingPartyController'
import IssuerController from './controllers/IssuerController'
import IssuanceScenarioController from './controllers/IssuanceScenarioController'
import PresentationScenarioController from './controllers/PresentationScenarioController'
import ShowcaseController from './controllers/ShowcaseController'
import { CredentialDefinitionController } from './controllers/CredentialDefinitionController'
import { CredentialSchemaController } from './controllers/CredentialSchemaController'
import { corsOptions } from './utils/cors'
import { registerServicesByInterface } from './services/RegisterServicesByInterface'
import TenantController from './controllers/TenantController'

require('dotenv-flow').config()
useContainer(Container)

async function bootstrap() {
  try {
    registerServicesByInterface()

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
      ],
      middlewares: [ExpressErrorHandler],
      defaultErrorHandler: false,
      cors: corsOptions,
    })
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
