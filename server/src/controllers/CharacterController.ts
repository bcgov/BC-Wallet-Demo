import type { CustomCharacter } from '../content/types'

import { Get, JsonController, NotFoundError, Param, QueryParam } from 'routing-controllers'
import { Inject, Service } from 'typedi'

import characters from '../content/Characters'

@JsonController('/characters')
@Service()
export class CharacterController {
  /**
   * Retrieve character by id
   */
  @Get('/:characterId')
  public async getCharacterById(@Param('characterId') characterId: string) {
    const character = characters.find((x) => x.type === characterId)

    if (!character) {
      throw new NotFoundError(`character with characterId "${characterId}" not found.`)
    }

    return { ...character, useCases: character.useCases }
  }

  /**
   * Retrieve all characters
   */
  @Get('/')
  public async getCharacters() {
    return characters
  }
}
