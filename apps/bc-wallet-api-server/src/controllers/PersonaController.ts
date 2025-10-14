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
import { createRequestLogger } from '../utils/logger'
import { personaDTOFrom } from '../utils/mappers'

@JsonController(getBasePath('/personas'))
@Service()
class PersonaController {
  private readonly logger = createRequestLogger('PersonaController')

  public constructor(private personaService: PersonaService) {}

  @Get('/')
  public async getAll(): Promise<PersonasResponse> {
    this.logger.info('Getting all personas')
    try {
      const result = await this.personaService.getAll()
      const personas = result.map((persona) => personaDTOFrom(persona))
      this.logger.info({ count: personas.length }, 'Successfully retrieved personas')
      return PersonasResponseFromJSONTyped({ personas }, false)
    } catch (e) {
      this.logger.error({ error: e }, 'Failed to get all personas')
      return Promise.reject(e)
    }
  }

  @Get('/:slug')
  public async get(@Param('slug') slug: string): Promise<PersonaResponse> {
    this.logger.info({ slug }, 'Getting persona by slug')
    const id = await this.personaService.getIdBySlug(slug)
    try {
      const result = await this.personaService.get(id)
      this.logger.info({ slug, id }, 'Successfully retrieved persona')
      return PersonaResponseFromJSONTyped({ persona: personaDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, slug, id }, 'Failed to get persona')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/')
  public async post(@Body() personaRequest: PersonaRequest): Promise<PersonaResponse> {
    this.logger.info({ personaName: personaRequest.name }, 'Creating new persona')
    try {
      if (!instanceOfPersonaRequest(personaRequest)) {
        this.logger.warn('Invalid persona request format')
        return Promise.reject(new BadRequestError())
      }
      const result = await this.personaService.create(PersonaRequestToJSONTyped(personaRequest))
      this.logger.info({ personaId: result.id, slug: result.slug }, 'Successfully created persona')
      return PersonaResponseFromJSONTyped({ persona: personaDTOFrom(result) }, false)
    } catch (e) {
      this.logger.error({ error: e }, 'Failed to create persona')
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:slug')
  public async put(@Param('slug') slug: string, @Body() personaRequest: PersonaRequest): Promise<PersonaResponse> {
    this.logger.info({ slug, personaName: personaRequest.name }, 'Updating persona')
    const id = await this.personaService.getIdBySlug(slug)
    try {
      if (!instanceOfPersonaRequest(personaRequest)) {
        this.logger.warn({ slug, id }, 'Invalid persona request format for update')
        return Promise.reject(new BadRequestError())
      }
      const result = await this.personaService.update(id, PersonaRequestToJSONTyped(personaRequest))
      this.logger.info({ slug, id }, 'Successfully updated persona')
      return PersonaResponseFromJSONTyped({ persona: personaDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, slug, id }, 'Failed to update persona')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:slug')
  public async delete(@Param('slug') slug: string): Promise<void> {
    this.logger.info({ slug }, 'Deleting persona')
    const id = await this.personaService.getIdBySlug(slug)
    try {
      await this.personaService.delete(id)
      this.logger.info({ slug, id }, 'Successfully deleted persona')
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, slug, id }, 'Failed to delete persona')
      }
      return Promise.reject(e)
    }
  }
}

export default PersonaController
