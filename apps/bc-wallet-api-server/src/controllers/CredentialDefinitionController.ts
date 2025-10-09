import {
  CredentialDefinitionImportRequest,
  CredentialDefinitionImportRequestToJSONTyped,
  CredentialDefinitionRequest,
  CredentialDefinitionRequestToJSONTyped,
  CredentialDefinitionResponse,
  CredentialDefinitionResponseFromJSONTyped,
  CredentialDefinitionsResponse,
  CredentialDefinitionsResponseFromJSONTyped,
  instanceOfCredentialDefinitionImportRequest,
  instanceOfCredentialDefinitionRequest,
} from 'bc-wallet-openapi'
import {
  Authorized,
  BadRequestError,
  Body,
  Delete,
  Get,
  HttpCode,
  JsonController,
  OnUndefined,
  Param,
  Post,
  Put,
} from 'routing-controllers'
import { Service } from 'typedi'

import CredentialDefinitionService from '../services/CredentialDefinitionService'
import { getBasePath } from '../utils/auth'
import { createRequestLogger } from '../utils/logger'
import { credentialDefinitionDTOFrom } from '../utils/mappers'

@JsonController(getBasePath('/credentials/definitions'))
@Service()
export class CredentialDefinitionController {
  private readonly logger = createRequestLogger('CredentialDefinitionController')

  public constructor(private credentialDefinitionService: CredentialDefinitionService) {}

  @Get('/')
  public async getAll(): Promise<CredentialDefinitionsResponse> {
    this.logger.info('Getting all credential definitions')
    try {
      const result = await this.credentialDefinitionService.getCredentialDefinitions()
      const credentialDefinitions = result.map((credentialDefinition) =>
        credentialDefinitionDTOFrom(credentialDefinition),
      )
      this.logger.info({ count: credentialDefinitions.length }, 'Successfully retrieved credential definitions')
      return CredentialDefinitionsResponseFromJSONTyped({ credentialDefinitions }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e }, 'Failed to get all credential definitions')
      }
      return Promise.reject(e)
    }
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<CredentialDefinitionResponse> {
    this.logger.info({ id }, 'Getting credential definition by id')
    try {
      const result = await this.credentialDefinitionService.getCredentialDefinition(id)
      this.logger.info({ id }, 'Successfully retrieved credential definition')
      return CredentialDefinitionResponseFromJSONTyped(
        { credentialDefinition: credentialDefinitionDTOFrom(result) },
        false,
      )
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to get credential definition')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/')
  public async post(
    @Body() credentialDefinitionRequest: CredentialDefinitionRequest,
  ): Promise<CredentialDefinitionResponse> {
    this.logger.info({ defName: credentialDefinitionRequest.name }, 'Creating new credential definition')
    try {
      if (!instanceOfCredentialDefinitionRequest(credentialDefinitionRequest)) {
        this.logger.warn('Invalid credential definition request format')
        return Promise.reject(new BadRequestError())
      }
      const result = await this.credentialDefinitionService.createCredentialDefinition(
        CredentialDefinitionRequestToJSONTyped(credentialDefinitionRequest),
      )
      this.logger.info({ defId: result.id }, 'Successfully created credential definition')
      return CredentialDefinitionResponseFromJSONTyped(
        { credentialDefinition: credentialDefinitionDTOFrom(result) },
        false,
      )
    } catch (e) {
      this.logger.error({ error: e }, 'Failed to create credential definition')
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Post('/import')
  public async importCredentialDefinition(
    @Body() credentialDefinitionRequest: CredentialDefinitionImportRequest,
  ): Promise<void> {
    this.logger.info({ defId: credentialDefinitionRequest.credentialDefinitionId }, 'Importing credential definition')
    try {
      if (!instanceOfCredentialDefinitionImportRequest(credentialDefinitionRequest)) {
        this.logger.warn('Invalid credential definition import request format')
        return Promise.reject(new BadRequestError())
      }
      await this.credentialDefinitionService.importCredentialDefinition(
        CredentialDefinitionImportRequestToJSONTyped(credentialDefinitionRequest),
      )
      this.logger.info({ defId: credentialDefinitionRequest.credentialDefinitionId }, 'Successfully imported credential definition')
    } catch (e) {
      this.logger.error({ error: e, defId: credentialDefinitionRequest.credentialDefinitionId }, 'Failed to import credential definition')
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:id')
  public async put(
    @Param('id') id: string,
    @Body() credentialDefinitionRequest: CredentialDefinitionRequest,
  ): Promise<CredentialDefinitionResponse> {
    this.logger.info({ id, defName: credentialDefinitionRequest.name }, 'Updating credential definition')
    try {
      if (!instanceOfCredentialDefinitionRequest(credentialDefinitionRequest)) {
        this.logger.warn({ id }, 'Invalid credential definition request format for update')
        return Promise.reject(new BadRequestError())
      }
      const result = await this.credentialDefinitionService.updateCredentialDefinition(
        id,
        CredentialDefinitionRequestToJSONTyped(credentialDefinitionRequest),
      )
      this.logger.info({ id }, 'Successfully updated credential definition')
      return CredentialDefinitionResponseFromJSONTyped(
        { credentialDefinition: credentialDefinitionDTOFrom(result) },
        false,
      )
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to update credential definition')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    this.logger.info({ id }, 'Deleting credential definition')
    try {
      await this.credentialDefinitionService.deleteCredentialDefinition(id)
      this.logger.info({ id }, 'Successfully deleted credential definition')
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to delete credential definition')
      }
      return Promise.reject(e)
    }
  }
}
