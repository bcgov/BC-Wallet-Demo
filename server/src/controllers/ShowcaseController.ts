import { Get, JsonController, NotFoundError, Param } from 'routing-controllers'
import { Service } from 'typedi'

import { ShowcaseModel } from '../db/models/Showcase'
import logger from '../utils/logger'

@JsonController('/showcases')
@Service()
export class ShowcaseController {
  /**
   * Retrieve showcase by id
   */
  @Get('/:showcaseId')
  public async getShowcaseById(@Param('showcaseId') showcaseId: string) {
    logger.debug({ showcaseId }, 'Fetching showcase by id')
    const showcase = await ShowcaseModel.findOne({ 'persona.type': showcaseId }).lean()

    if (!showcase) {
      logger.warn({ showcaseId }, 'Showcase not found')
      throw new NotFoundError(`showcase with showcaseId "${showcaseId}" not found.`)
    }

    logger.debug({ showcaseId }, 'Showcase found')
    return showcase
  }

  /**
   * Retrieve all showcases
   */
  @Get('/')
  public async getShowcases() {
    const showcases = await ShowcaseModel.find().lean()
    logger.debug({ count: showcases.length }, 'Fetching all showcases')
    return showcases
  }
}
