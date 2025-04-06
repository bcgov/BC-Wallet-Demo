import 'reflect-metadata'
import { Action, createExpressServer, useContainer } from 'routing-controllers'
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
import * as process from 'node:process'
import KeycloakConnect, { Token } from 'keycloak-connect'
import { checkRoles } from './utils/auth'

require('dotenv-flow').config()
useContainer(Container)

const keycloak = new KeycloakConnect({}, {
  realm: 'BC',
  'auth-server-url': 'http://localhost:8080',
  resource: 'showcase-tentantA',
  'bearer-only': false,
  'ssl-required': 'false',
  'confidential-port': 0
})

async function bootstrap() {
  try {
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
      ],
      authorizationChecker: async (action: Action, roles: string[]): Promise<boolean> => {
        try {
          // getGrant() must be called to correctly populate the Token object
          const grant = await keycloak.getGrant(action.request, action.response)
          if (!grant.access_token) {
            return false
          }
          // Throws error if the token is invalid. it validates claims and signature
          await keycloak.grantManager.validateToken(grant.access_token as Token, 'Bearer')
          // Realm roles must be prefixed with 'realm:', client roles must be prefixed with the value of clientId + : and
          // User roles which at the moment we are not using, do not need any prefix.
          return checkRoles(grant.access_token, roles)
        } catch (e: any) {
          return false
        }
      },
      middlewares: [keycloak.middleware, ExpressErrorHandler],
      defaultErrorHandler: false,
      cors: corsOptions,
    })

    app.use(keycloak.middleware())
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
