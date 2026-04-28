import { Get, JsonController, NotFoundError, Param } from 'routing-controllers'
import { Service } from 'typedi'

import showcases from '../content/Showcases'
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
    const showcase = showcases.find((x) => x.persona.type === showcaseId)

    if (!showcase) {
      logger.warn({ showcaseId }, 'Showcase not found')
      throw new NotFoundError(`showcase with showcaseId "${showcaseId}" not found.`)
    }

    logger.debug({ showcaseId }, 'Showcase found')
    return { ...showcase, scenarios: showcase.scenarios }
  }

  /**
   * Retrieve all showcases
   */
  @Get('/')
  public async getShowcases() {
    logger.debug({ count: showcases.length }, 'Fetching all showcases')
    return showcases
  }
}
