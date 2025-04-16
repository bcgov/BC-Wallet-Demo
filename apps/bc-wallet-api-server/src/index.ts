import 'reflect-metadata'
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
import * as process from 'node:process'
import { ExpressErrorHandler } from './middleware/ExpressErrorHandler'
import { registerServicesByInterface } from './services/RegisterServicesByInterface'
import { corsOptions } from './utils/cors'

require('dotenv-flow').config()
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
      // authorizationChecker: async (action: Action, roles: string[]): Promise<boolean> => {
      //   const authHeader: string = action.request.headers['authorization']
      //   if (!authHeader || !authHeader.startsWith('Bearer ')) {
      //     throw new UnauthorizedError('Missing or malformed Authorization header')
      //   }

      //   try  {
      //       const accessToken = authHeader.split(' ')[1]
      //       // Introspect the access token
      //       if (!await isAccessTokenValid(accessToken)) {
      //         return false
      //       }
      //       const token = new Token(accessToken, `${process.env.CLIENT_ID}`)
      //       // Realm roles must be prefixed with 'realm:', client roles must be prefixed with the value of clientId + : and
      //       // User roles which at the moment we are not using, do not need any prefix.
      //       return checkRoles(token, roles)
      //   } catch (e) {
      //     throw new UnauthorizedError(e.message)
      //   }
      // },
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
