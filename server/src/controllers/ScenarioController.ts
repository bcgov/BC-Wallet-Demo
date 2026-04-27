import { Get, JsonController, NotFoundError, Param, QueryParam } from 'routing-controllers'
import { Service } from 'typedi'

import characters from '../content/Characters'
import logger from '../utils/logger'

const scenarios = characters.map((c) => c.scenarios)
@JsonController('/usecases')
@Service()
export class ScenarioController {
  /**
   * Retrieve use case by slug
   */
  @Get('/:useCaseSlug')
  public async getUseCaseBySlug(@Param('useCaseSlug') useCaseSlug: string) {
    logger.debug({ useCaseSlug }, 'Fetching use case by slug')
    const scenario = scenarios.flat().find((x) => x.id === useCaseSlug)

    if (!scenario) {
      logger.warn({ useCaseSlug }, 'Scenario not found')
      throw new NotFoundError(`use case with slug "${useCaseSlug}" not found.`)
    }
    return scenario
  }

  /**
   * Retrieve all usecases for given character id
   */
  @Get('/character/:type')
  public async getUseCasesByCharType(@Param('type') type: string, @QueryParam('showHidden') showHidden?: boolean) {
    logger.debug({ type, showHidden }, 'Fetching use cases by character type')
    const character = characters.find((c) => c.type === type)

    if (!character) {
      logger.warn({ type }, 'Character type not found for scenario lookup')
      throw new NotFoundError(`Use cases for character with type "${type}" not found.`)
    }

    return showHidden ? character.scenarios : character.scenarios.filter((s) => !s.hidden)
  }
}
