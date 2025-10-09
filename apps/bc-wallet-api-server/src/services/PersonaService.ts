import { Service } from 'typedi'

import PersonaRepository from '../database/repositories/PersonaRepository'
import { NewPersona, Persona } from '../types'
import { createRequestLogger } from '../utils/logger'

@Service()
class PersonaService {
  private readonly logger = createRequestLogger('PersonaService')

  public constructor(private readonly personaRepository: PersonaRepository) {}

  public getAll = async (): Promise<Persona[]> => {
    this.logger.info('Retrieving all personas')
    try {
      const personas = await this.personaRepository.findAll()
      this.logger.info({ count: personas.length }, 'Successfully retrieved personas')
      return personas
    } catch (error) {
      this.logger.error({ error }, 'Failed to retrieve personas')
      throw error
    }
  }

  public get = async (id: string): Promise<Persona> => {
    this.logger.info({ personaId: id }, 'Retrieving persona by id')
    try {
      const persona = await this.personaRepository.findById(id)
      this.logger.info({ personaId: id, slug: persona.slug }, 'Successfully retrieved persona')
      return persona
    } catch (error) {
      this.logger.error({ error, personaId: id }, 'Failed to retrieve persona')
      throw error
    }
  }

  public create = async (persona: NewPersona): Promise<Persona> => {
    this.logger.info({ personaName: persona.name }, 'Creating new persona')
    try {
      const createdPersona = await this.personaRepository.create(persona)
      this.logger.info({ personaId: createdPersona.id, slug: createdPersona.slug }, 'Successfully created persona')
      return createdPersona
    } catch (error) {
      this.logger.error({ error, personaName: persona.name }, 'Failed to create persona')
      throw error
    }
  }

  public update = async (id: string, persona: NewPersona): Promise<Persona> => {
    this.logger.info({ personaId: id, personaName: persona.name }, 'Updating persona')
    try {
      const updatedPersona = await this.personaRepository.update(id, persona)
      this.logger.info({ personaId: id, slug: updatedPersona.slug }, 'Successfully updated persona')
      return updatedPersona
    } catch (error) {
      this.logger.error({ error, personaId: id }, 'Failed to update persona')
      throw error
    }
  }

  public delete = async (id: string): Promise<void> => {
    this.logger.info({ personaId: id }, 'Deleting persona')
    try {
      await this.personaRepository.delete(id)
      this.logger.info({ personaId: id }, 'Successfully deleted persona')
    } catch (error) {
      this.logger.error({ error, personaId: id }, 'Failed to delete persona')
      throw error
    }
  }

  public getIdBySlug = async (slug: string): Promise<string> => {
    this.logger.info({ slug }, 'Finding persona ID by slug')
    try {
      const id = await this.personaRepository.findIdBySlug(slug)
      this.logger.info({ slug, personaId: id }, 'Successfully found persona ID by slug')
      return id
    } catch (error) {
      this.logger.error({ error, slug }, 'Failed to find persona ID by slug')
      throw error
    }
  }
}

export default PersonaService
