import {
  instanceOfIssuerRequest,
  IssuerRequest,
  IssuerRequestToJSONTyped,
  IssuerResponse,
  IssuerResponseFromJSONTyped,
  IssuersResponse,
  IssuersResponseFromJSONTyped,
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

import IssuerService from '../services/IssuerService'
import { getBasePath } from '../utils/auth'
import { createRequestLogger } from '../utils/logger'
import { issuerDTOFrom } from '../utils/mappers'

@JsonController(getBasePath('/roles/issuers'))
@Service()
class IssuerController {
  private readonly logger = createRequestLogger('IssuerController')

  public constructor(private issuerService: IssuerService) {}

  @Get('/')
  public async getAll(): Promise<IssuersResponse> {
    this.logger.info('Getting all issuers')
    try {
      const result = await this.issuerService.getIssuers()
      const issuers = result.map((issuer) => issuerDTOFrom(issuer))
      this.logger.info({ count: issuers.length }, 'Successfully retrieved issuers')
      return IssuersResponseFromJSONTyped({ issuers }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e }, 'Failed to get all issuers')
      }
      return Promise.reject(e)
    }
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<IssuerResponse> {
    this.logger.info({ id }, 'Getting issuer by id')
    try {
      const result = await this.issuerService.getIssuer(id)
      this.logger.info({ id }, 'Successfully retrieved issuer')
      return IssuerResponseFromJSONTyped({ issuer: issuerDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to get issuer')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/')
  public async post(@Body() issuerRequest: IssuerRequest): Promise<IssuerResponse> {
    this.logger.info({ tenantId: issuerRequest.tenantId }, 'Creating new issuer')
    try {
      if (!instanceOfIssuerRequest(issuerRequest)) {
        this.logger.warn('Invalid issuer request format')
        return Promise.reject(new BadRequestError())
      }
      const result = await this.issuerService.createIssuer(IssuerRequestToJSONTyped(issuerRequest))
      this.logger.info({ issuerId: result.id }, 'Successfully created issuer')
      return IssuerResponseFromJSONTyped({ issuer: issuerDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e }, 'Failed to create issuer')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:id')
  public async put(@Param('id') id: string, @Body() issuerRequest: IssuerRequest): Promise<IssuerResponse> {
    this.logger.info({ id }, 'Updating issuer')
    try {
      if (!instanceOfIssuerRequest(issuerRequest)) {
        this.logger.warn({ id }, 'Invalid issuer request format for update')
        return Promise.reject(new BadRequestError())
      }
      const result = await this.issuerService.updateIssuer(id, IssuerRequestToJSONTyped(issuerRequest))
      this.logger.info({ id }, 'Successfully updated issuer')
      return IssuerResponseFromJSONTyped({ issuer: issuerDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to update issuer')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Post('/:id/publish')
  public async publish(@Param('id') id: string): Promise<void> {
    this.logger.info({ id }, 'Publishing issuer')
    try {
      await this.issuerService.publishIssuer(id)
      this.logger.info({ id }, 'Successfully published issuer')
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to publish issuer')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    this.logger.info({ id }, 'Deleting issuer')
    try {
      await this.issuerService.deleteIssuer(id)
      this.logger.info({ id }, 'Successfully deleted issuer')
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to delete issuer')
      }
      return Promise.reject(e)
    }
  }
}

export default IssuerController
