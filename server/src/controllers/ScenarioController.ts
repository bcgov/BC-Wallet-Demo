import { Get, JsonController, NotFoundError, Param, QueryParam } from 'routing-controllers'
import { Service } from 'typedi'

import { ShowcaseModel } from '../db/models/Showcase'
import logger from '../utils/logger'

@JsonController('/scenarios')
@Service()
export class ScenarioController {
  /**
   * Retrieve scenario by slug
   */
  @Get('/:useCaseSlug')
  public async getScenarioBySlug(@Param('useCaseSlug') scenarioSlug: string) {
    logger.debug({ scenarioSlug }, 'Fetching scenario by slug')
    const showcases = await ShowcaseModel.find().lean()
    const scenario = showcases.flatMap((s) => s.scenarios).find((x) => x.id === scenarioSlug)

    if (!scenario) {
      logger.warn({ scenarioSlug }, 'Scenario not found')
      throw new NotFoundError(`Scenario with slug "${scenarioSlug}" not found.`)
    }
    return scenario
  }

  /**
   * Retrieve all scenarios for given character id
   */
  @Get('/character/:type')
  public async getScenariosByCharType(@Param('type') type: string, @QueryParam('showHidden') showHidden?: boolean) {
    logger.debug({ type, showHidden }, 'Fetching scenarios by character type')
    const character = await ShowcaseModel.findOne({ 'persona.type': type }).lean()

    if (!character) {
      logger.warn({ type }, 'Character type not found for scenario lookup')
      throw new NotFoundError(`Scenarios for character with type "${type}" not found.`)
    }

    return showHidden ? character.scenarios : character.scenarios.filter((s) => !s.hidden)
  }
}
