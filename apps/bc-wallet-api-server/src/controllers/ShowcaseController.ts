import {
  instanceOfShowcaseRequest,
  ShowcaseRequest,
  ShowcaseRequestToJSONTyped,
  ShowcaseResponse,
  ShowcaseResponseFromJSONTyped,
  ShowcasesResponse,
  ShowcasesResponseFromJSONTyped,
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

import DuplicationShowcaseService from '../services/DuplicationShowcaseService'
import ShowcaseService from '../services/ShowcaseService'
import { getBasePath } from '../utils/auth'
import { showcaseDTOFrom } from '../utils/mappers'

@JsonController(getBasePath('/showcases'))
@Service()
class ShowcaseController {
  public constructor(
    private showcaseService: ShowcaseService,
    private duplicationShowcaseService: DuplicationShowcaseService,
  ) {}

  @Get('/')
  public async getAll(): Promise<ShowcasesResponse> {
    try {
      const result = await this.showcaseService.getShowcases()
      const showcases = result.map((showcase) => showcaseDTOFrom(showcase))
      return ShowcasesResponseFromJSONTyped({ showcases }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get all showcases failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:slug')
  public async getOne(@Param('slug') slug: string): Promise<ShowcaseResponse> {
    const id = await this.showcaseService.getIdBySlug(slug)
    try {
      const result = await this.showcaseService.getShowcase(id)
      return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get showcase id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/')
  public async post(
    @Body({ options: { limit: '250mb' } }) showcaseRequest: ShowcaseRequest,
  ): Promise<ShowcaseResponse> {
    try {
      if (!instanceOfShowcaseRequest(showcaseRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.showcaseService.createShowcase(ShowcaseRequestToJSONTyped(showcaseRequest))
      return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Create showcase failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:slug')
  public async put(
    @Param('slug') slug: string,
    @Body({ options: { limit: '250mb' } }) showcaseRequest: ShowcaseRequest,
  ): Promise<ShowcaseResponse> {
    const id = await this.showcaseService.getIdBySlug(slug)
    try {
      if (!instanceOfShowcaseRequest(showcaseRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.showcaseService.updateShowcase(id, ShowcaseRequestToJSONTyped(showcaseRequest))
      return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Update showcase id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:slug')
  public async delete(@Param('slug') slug: string): Promise<void> {
    const id = await this.showcaseService.getIdBySlug(slug)
    try {
      return this.showcaseService.deleteShowcase(id)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Delete showcase id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/:slug/duplicate')
  public async duplicate(@Param('slug') slug: string): Promise<ShowcaseResponse> {
    const id = await this.showcaseService.getIdBySlug(slug)
    try {
      const result = await this.duplicationShowcaseService.duplicateShowcase(id)
      return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Duplicate showcase id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }
}

export default ShowcaseController
