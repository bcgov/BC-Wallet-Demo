import {
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
import {
  instanceOfShowcaseRequest,
  ShowcaseRequest,
  ShowcaseRequestToJSONTyped,
  ShowcaseResponse,
  ShowcaseResponseFromJSONTyped,
  ShowcasesResponse,
  ShowcasesResponseFromJSONTyped,
} from 'bc-wallet-openapi'
import ShowcaseService from '../services/ShowcaseService'
import { showcaseDTOFrom } from '../utils/mappers'

@JsonController('/showcases')
@Service()
class ShowcaseController {
  constructor(private showcaseService: ShowcaseService) {}

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

  @HttpCode(201)
  @Post('/')
  public async post(@Body() showcaseRequest: ShowcaseRequest): Promise<ShowcaseResponse> {
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

  @Put('/:slug')
  public async put(@Param('slug') slug: string, @Body() showcaseRequest: ShowcaseRequest): Promise<ShowcaseResponse> {
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
}

export default ShowcaseController
