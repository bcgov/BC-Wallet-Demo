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
import { credentialDefinitionDTOFrom } from '../utils/mappers'

@JsonController('/credentials/definitions')
@Service()
export class CredentialDefinitionController {
  public constructor(private credentialDefinitionService: CredentialDefinitionService) {}

  @Get('/')
  public async getAll(): Promise<CredentialDefinitionsResponse> {
    try {
      const result = await this.credentialDefinitionService.getCredentialDefinitions()
      const credentialDefinitions = result.map((credentialDefinition) =>
        credentialDefinitionDTOFrom(credentialDefinition),
      )
      return CredentialDefinitionsResponseFromJSONTyped({ credentialDefinitions }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error('getAll definitions failed:', e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<CredentialDefinitionResponse> {
    try {
      const result = await this.credentialDefinitionService.getCredentialDefinition(id)
      return CredentialDefinitionResponseFromJSONTyped(
        { credentialDefinition: credentialDefinitionDTOFrom(result) },
        false,
      )
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`getOne definition id=${id} failed:`, e)
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
    try {
      if (!instanceOfCredentialDefinitionRequest(credentialDefinitionRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.credentialDefinitionService.createCredentialDefinition(
        CredentialDefinitionRequestToJSONTyped(credentialDefinitionRequest),
      )
      return CredentialDefinitionResponseFromJSONTyped(
        { credentialDefinition: credentialDefinitionDTOFrom(result) },
        false,
      )
    } catch (e) {
      console.error('credentialDefinitionRequest post failed:', e)
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Post('/import')
  public async importCredentialDefinition(
    @Body() credentialDefinitionRequest: CredentialDefinitionImportRequest,
  ): Promise<void> {
    try {
      if (!instanceOfCredentialDefinitionImportRequest(credentialDefinitionRequest)) {
        return Promise.reject(new BadRequestError())
      }
      await this.credentialDefinitionService.importCredentialDefinition(
        CredentialDefinitionImportRequestToJSONTyped(credentialDefinitionRequest),
      )
    } catch (e) {
      console.error('importCredentialDefinition failed:', e)
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:id')
  public async put(
    @Param('id') id: string,
    @Body() credentialDefinitionRequest: CredentialDefinitionRequest,
  ): Promise<CredentialDefinitionResponse> {
    try {
      if (!instanceOfCredentialDefinitionRequest(credentialDefinitionRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.credentialDefinitionService.updateCredentialDefinition(
        id,
        CredentialDefinitionRequestToJSONTyped(credentialDefinitionRequest),
      )
      return CredentialDefinitionResponseFromJSONTyped(
        { credentialDefinition: credentialDefinitionDTOFrom(result) },
        false,
      )
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`put definition id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    try {
      return this.credentialDefinitionService.deleteCredentialDefinition(id)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`delete definition id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }
}
