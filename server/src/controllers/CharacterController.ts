import { Get, JsonController, NotFoundError, Param } from 'routing-controllers'
import { Service } from 'typedi'

import characters from '../content/Characters'
import logger from '../utils/logger'

@JsonController('/characters')
@Service()
export class CharacterController {
  /**
   * Retrieve character by id
   */
  @Get('/:characterId')
  public async getCharacterById(@Param('characterId') characterId: string) {
    logger.debug({ characterId }, 'Fetching character by id')
    const character = characters.find((x) => x.type === characterId)

    if (!character) {
      logger.warn({ characterId }, 'Character not found')
      throw new NotFoundError(`character with characterId "${characterId}" not found.`)
    }

    logger.debug({ characterId }, 'Character found')
    return { ...character, scenarios: character.scenarios }
  }

  /**
   * Retrieve all characters
   */
  @Get('/')
  public async getCharacters() {
    logger.debug({ count: characters.length }, 'Fetching all characters')
    return characters
  }
}
