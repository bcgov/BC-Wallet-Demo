import {
  instanceOfPersonaRequest,
  PersonaRequest,
  PersonaRequestToJSONTyped,
  PersonaResponse,
  PersonaResponseFromJSONTyped,
  PersonasResponse,
  PersonasResponseFromJSONTyped,
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

import PersonaService from '../services/PersonaService'
import { getBasePath } from '../utils/auth'
import { personaDTOFrom } from '../utils/mappers'

@JsonController(getBasePath('/personas'))
@Service()
class PersonaController {
  public constructor(private personaService: PersonaService) {}

  @Get('/')
  public async getAll(): Promise<PersonasResponse> {
    try {
      const result = await this.personaService.getAll()
      const personas = result.map((persona) => personaDTOFrom(persona))
      return PersonasResponseFromJSONTyped({ personas }, false)
    } catch (e) {
      console.error(`getAll failed:`, e)
      return Promise.reject(e)
    }
  }

  @Get('/:slug')
  public async get(@Param('slug') slug: string): Promise<PersonaResponse> {
    const id = await this.personaService.getIdBySlug(slug)
    try {
      const result = await this.personaService.get(id)
      return PersonaResponseFromJSONTyped({ persona: personaDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`get id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/')
  public async post(@Body() personaRequest: PersonaRequest): Promise<PersonaResponse> {
    try {
      if (!instanceOfPersonaRequest(personaRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.personaService.create(PersonaRequestToJSONTyped(personaRequest))
      return PersonaResponseFromJSONTyped({ persona: personaDTOFrom(result) }, false)
    } catch (e) {
      console.error(`post failed:`, e)
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:slug')
  public async put(@Param('slug') slug: string, @Body() personaRequest: PersonaRequest): Promise<PersonaResponse> {
    const id = await this.personaService.getIdBySlug(slug)
    try {
      if (!instanceOfPersonaRequest(personaRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.personaService.update(id, PersonaRequestToJSONTyped(personaRequest))
      return PersonaResponseFromJSONTyped({ persona: personaDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`put id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:slug')
  public async delete(@Param('slug') slug: string): Promise<void> {
    const id = await this.personaService.getIdBySlug(slug)
    try {
      return await this.personaService.delete(id)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`delete id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }
}

export default PersonaController
