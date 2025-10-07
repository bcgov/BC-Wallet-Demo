import {
  CredentialSchemaImportRequest,
  CredentialSchemaRequest,
  CredentialSchemaRequestToJSONTyped,
  CredentialSchemaResponse,
  CredentialSchemaResponseFromJSONTyped,
  CredentialSchemasResponse,
  CredentialSchemasResponseFromJSONTyped,
  instanceOfCredentialSchemaImportRequest,
  instanceOfCredentialSchemaRequest,
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

import CredentialSchemaService from '../services/CredentialSchemaService'
import { getBasePath } from '../utils/auth'
import { createRequestLogger } from '../utils/logger'

@JsonController(getBasePath('/credentials/schemas'))
@Service()
export class CredentialSchemaController {
  private readonly logger = createRequestLogger('CredentialSchemaController')

  public constructor(private readonly credentialSchemaService: CredentialSchemaService) {}

  @Get('/')
  public async getAll(): Promise<CredentialSchemasResponse> {
    this.logger.info('Getting all credential schemas')
    try {
      const result = await this.credentialSchemaService.getCredentialSchemas()
      this.logger.info({ count: result.length }, 'Successfully retrieved credential schemas')
      return CredentialSchemasResponseFromJSONTyped({ credentialSchemas: result }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e }, 'Failed to get all credential schemas')
      }
      return Promise.reject(e)
    }
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<CredentialSchemaResponse> {
    this.logger.info({ id }, 'Getting credential schema by id')
    try {
      const credentialSchema = await this.credentialSchemaService.getCredentialSchema(id)
      this.logger.info({ id }, 'Successfully retrieved credential schema')
      return CredentialSchemaResponseFromJSONTyped({ credentialSchema }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to get credential schema')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/')
  public async post(@Body() credentialSchemaRequest: CredentialSchemaRequest): Promise<CredentialSchemaResponse> {
    this.logger.info({ schemaName: credentialSchemaRequest.name }, 'Creating new credential schema')
    try {
      if (!instanceOfCredentialSchemaRequest(credentialSchemaRequest)) {
        this.logger.warn('Invalid credential schema request format')
        return Promise.reject(new BadRequestError())
      }
      const credentialSchema = await this.credentialSchemaService.createCredentialSchema(
        CredentialSchemaRequestToJSONTyped(credentialSchemaRequest),
      )
      this.logger.info({ schemaId: credentialSchema.id }, 'Successfully created credential schema')
      return CredentialSchemaResponseFromJSONTyped({ credentialSchema }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e }, 'Failed to create credential schema')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Post('/import')
  public async importSchema(@Body() importRequest: CredentialSchemaImportRequest): Promise<void> {
    this.logger.info({ schemaId: importRequest.credentialSchemaId }, 'Importing credential schema')
    try {
      if (!instanceOfCredentialSchemaImportRequest(importRequest)) {
        this.logger.warn('Invalid credential schema import request format')
        return Promise.reject(new BadRequestError())
      }
      await this.credentialSchemaService.importCredentialSchema(importRequest)
      this.logger.info({ schemaId: importRequest.credentialSchemaId }, 'Successfully imported credential schema')
    } catch (e) {
      this.logger.error({ error: e, schemaId: importRequest.credentialSchemaId }, 'Failed to import credential schema')
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:id')
  public async put(
    @Param('id') id: string,
    @Body() credentialSchemaRequest: CredentialSchemaRequest,
  ): Promise<CredentialSchemaResponse> {
    this.logger.info({ id, schemaName: credentialSchemaRequest.name }, 'Updating credential schema')
    try {
      if (!instanceOfCredentialSchemaRequest(credentialSchemaRequest)) {
        this.logger.warn({ id }, 'Invalid credential schema request format for update')
        return Promise.reject(new BadRequestError())
      }
      const credentialSchema = await this.credentialSchemaService.updateCredentialSchema(
        id,
        CredentialSchemaRequestToJSONTyped(credentialSchemaRequest),
      )
      this.logger.info({ id }, 'Successfully updated credential schema')
      return CredentialSchemaResponseFromJSONTyped({ credentialSchema }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to update credential schema')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    this.logger.info({ id }, 'Deleting credential schema')
    try {
      await this.credentialSchemaService.deleteCredentialSchema(id)
      this.logger.info({ id }, 'Successfully deleted credential schema')
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to delete credential schema')
      }
      return Promise.reject(e)
    }
  }
}
