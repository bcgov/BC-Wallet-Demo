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
import { createRequestLogger } from '../utils/logger'
import { showcaseDTOFrom } from '../utils/mappers'

@JsonController(getBasePath('/showcases'))
@Service()
class ShowcaseController {
  private readonly logger = createRequestLogger('ShowcaseController')

  public constructor(
    private showcaseService: ShowcaseService,
    private duplicationShowcaseService: DuplicationShowcaseService,
  ) {}

  @Get('/')
  public async getAll(): Promise<ShowcasesResponse> {
    this.logger.info('Getting all showcases')
    try {
      const result = await this.showcaseService.getShowcases()
      const showcases = result.map((showcase) => showcaseDTOFrom(showcase))
      this.logger.info({ count: showcases.length }, 'Successfully retrieved showcases')
      return ShowcasesResponseFromJSONTyped({ showcases }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e }, 'Failed to get all showcases')
      }
      return Promise.reject(e)
    }
  }

  @Get('/:slug')
  public async getOne(@Param('slug') slug: string): Promise<ShowcaseResponse> {
    this.logger.info({ slug }, 'Getting showcase by slug')
    const id = await this.showcaseService.getIdBySlug(slug)
    try {
      const result = await this.showcaseService.getShowcase(id)
      this.logger.info({ slug, id }, 'Successfully retrieved showcase')
      return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, slug, id }, 'Failed to get showcase')
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
    this.logger.info({ tenantId: showcaseRequest.tenantId }, 'Creating new showcase')
    try {
      if (!instanceOfShowcaseRequest(showcaseRequest)) {
        this.logger.warn('Invalid showcase request format')
        return Promise.reject(new BadRequestError())
      }
      const result = await this.showcaseService.createShowcase(ShowcaseRequestToJSONTyped(showcaseRequest))
      this.logger.info({ showcaseId: result.id, slug: result.slug }, 'Successfully created showcase')
      return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e }, 'Failed to create showcase')
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
    this.logger.info({ slug }, 'Updating showcase')
    const id = await this.showcaseService.getIdBySlug(slug)
    try {
      if (!instanceOfShowcaseRequest(showcaseRequest)) {
        this.logger.warn({ slug, id }, 'Invalid showcase request format for update')
        return Promise.reject(new BadRequestError())
      }
      const result = await this.showcaseService.updateShowcase(id, ShowcaseRequestToJSONTyped(showcaseRequest))
      this.logger.info({ slug, id }, 'Successfully updated showcase')
      return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, slug, id }, 'Failed to update showcase')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:slug')
  public async delete(@Param('slug') slug: string): Promise<void> {
    this.logger.info({ slug }, 'Deleting showcase')
    const id = await this.showcaseService.getIdBySlug(slug)
    try {
      await this.showcaseService.deleteShowcase(id)
      this.logger.info({ slug, id }, 'Successfully deleted showcase')
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, slug, id }, 'Failed to delete showcase')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/:slug/duplicate')
  public async duplicate(@Param('slug') slug: string): Promise<ShowcaseResponse> {
    this.logger.info({ slug }, 'Duplicating showcase')
    const id = await this.showcaseService.getIdBySlug(slug)
    try {
      const result = await this.duplicationShowcaseService.duplicateShowcase(id)
      this.logger.info({ originalSlug: slug, originalId: id, newId: result.id, newSlug: result.slug }, 'Successfully duplicated showcase')
      return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, slug, id }, 'Failed to duplicate showcase')
      }
      return Promise.reject(e)
    }
  }
}

export default ShowcaseController
