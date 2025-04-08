import 'reflect-metadata'
import { Action, createExpressServer, useContainer } from 'routing-controllers'
import Container from 'typedi'
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
import { checkRoles, isAccessTokenAudienceValid, isAccessTokenValid, Token } from './utils/auth'
import { ExpressErrorHandler } from './middleware/ExpressErrorHandler'

require('dotenv-flow').config()
useContainer(Container)



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
          const accessToken: string = action.request.headers['authorization'].split(' ')[1]
          // Introspect the access token
          if(!await isAccessTokenValid(accessToken)) {
            return false
          }
          const token = new Token(accessToken, `${process.env.CLIENT_ID}`)
          // Check if the audience is valid.
          if (!isAccessTokenAudienceValid(token)) {
            return false
          }
          // Realm roles must be prefixed with 'realm:', client roles must be prefixed with the value of clientId + : and
          // User roles which at the moment we are not using, do not need any prefix.
          return checkRoles(token, roles)
      },
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
