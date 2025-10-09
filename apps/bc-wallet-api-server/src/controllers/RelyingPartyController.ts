import {
  instanceOfRelyingPartyRequest,
  RelyingPartiesResponse,
  RelyingPartiesResponseFromJSONTyped,
  RelyingPartyRequest,
  RelyingPartyRequestToJSONTyped,
  RelyingPartyResponse,
  RelyingPartyResponseFromJSONTyped,
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

import RelyingPartyService from '../services/RelyingPartyService'
import { getBasePath } from '../utils/auth'
import { createRequestLogger } from '../utils/logger'
import { relyingPartyDTOFrom } from '../utils/mappers'

@JsonController(getBasePath('/roles/relying-parties'))
@Service()
class RelyingPartyController {
  private readonly logger = createRequestLogger('RelyingPartyController')

  public constructor(private relyingPartyService: RelyingPartyService) {}

  @Get('/')
  public async getAll(): Promise<RelyingPartiesResponse> {
    this.logger.info('Getting all relying parties')
    try {
      const result = await this.relyingPartyService.getRelyingParties()
      const relyingParties = result.map((relyingParty) => relyingPartyDTOFrom(relyingParty))
      this.logger.info({ count: relyingParties.length }, 'Successfully retrieved relying parties')
      return RelyingPartiesResponseFromJSONTyped({ relyingParties }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e }, 'Failed to get all relying parties')
      }
      return Promise.reject(e)
    }
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<RelyingPartyResponse> {
    this.logger.info({ id }, 'Getting relying party by id')
    try {
      const result = await this.relyingPartyService.getRelyingParty(id)
      this.logger.info({ id }, 'Successfully retrieved relying party')
      return RelyingPartyResponseFromJSONTyped({ relyingParty: relyingPartyDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, `Get relying party id=${id} failed`)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/')
  public async post(@Body() relyingPartyRequest: RelyingPartyRequest): Promise<RelyingPartyResponse> {
    this.logger.info({ name: relyingPartyRequest.name }, 'Creating new relying party')
    try {
      if (!instanceOfRelyingPartyRequest(relyingPartyRequest)) {
        this.logger.warn('Invalid relying party request format')
        return Promise.reject(new BadRequestError())
      }
      const result = await this.relyingPartyService.createRelyingParty(
        RelyingPartyRequestToJSONTyped(relyingPartyRequest),
      )
      this.logger.info({ relyingPartyId: result.id }, 'Successfully created relying party')
      return RelyingPartyResponseFromJSONTyped({ relyingParty: relyingPartyDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, relyingPartyRequest }, `Create relying party failed`)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:id')
  public async put(
    @Param('id') id: string,
    @Body() relyingPartyRequest: RelyingPartyRequest,
  ): Promise<RelyingPartyResponse> {
    try {
      if (!instanceOfRelyingPartyRequest(relyingPartyRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.relyingPartyService.updateRelyingParty(
        id,
        RelyingPartyRequestToJSONTyped(relyingPartyRequest),
      )
      return RelyingPartyResponseFromJSONTyped({ relyingParty: relyingPartyDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id, relyingPartyRequest }, `Update relying party id=${id} failed`)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    try {
      return this.relyingPartyService.deleteRelyingParty(id)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, `Delete relying party id=${id} failed`)
      }
      return Promise.reject(e)
    }
  }
}

export default RelyingPartyController
