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
  Put
} from 'routing-controllers'
import { Service } from 'typedi'
import {
  instanceOfIssuerRequest,
  IssuerRequest,
  IssuerRequestToJSONTyped,
  IssuerResponse,
  IssuerResponseFromJSONTyped,
  IssuersResponse,
  IssuersResponseFromJSONTyped,
} from 'bc-wallet-openapi'
import IssuerService from '../services/IssuerService'
import { issuerDTOFrom } from '../utils/mappers'

@JsonController('/roles/issuers')
@Service()
class IssuerController {
  constructor(private issuerService: IssuerService) {}

  @Get('/')
  public async getAll(): Promise<IssuersResponse> {
    try {
      const result = await this.issuerService.getIssuers()
      const issuers = result.map((issuer) => issuerDTOFrom(issuer))
      return IssuersResponseFromJSONTyped({ issuers }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get all issuers failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<IssuerResponse> {
    try {
      const result = await this.issuerService.getIssuer(id)
      return IssuerResponseFromJSONTyped({ issuer: issuerDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get issuer id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/')
  public async post(@Body() issuerRequest: IssuerRequest): Promise<IssuerResponse> {
    try {
      if (!instanceOfIssuerRequest(issuerRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.issuerService.createIssuer(IssuerRequestToJSONTyped(issuerRequest))
      return IssuerResponseFromJSONTyped({ issuer: issuerDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Create issuer failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:id')
  public async put(@Param('id') id: string, @Body() issuerRequest: IssuerRequest): Promise<IssuerResponse> {
    try {
      if (!instanceOfIssuerRequest(issuerRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.issuerService.updateIssuer(id, IssuerRequestToJSONTyped(issuerRequest))
      return IssuerResponseFromJSONTyped({ issuer: issuerDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Update issuer id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    try {
      return this.issuerService.deleteIssuer(id)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Delete issuer id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }
}

export default IssuerController
