import { Service } from 'typedi'
import PersonaRepository from '../database/repositories/PersonaRepository'
import { NewPersona, Persona } from '../types'

@Service()
class PersonaService {
  constructor(private readonly personaRepository: PersonaRepository) {}

  public getAll = async (): Promise<Persona[]> => {
    return this.personaRepository.findAll()
  }

  public get = async (id: string): Promise<Persona> => {
    return this.personaRepository.findById(id)
  }

  public create = async (persona: NewPersona): Promise<Persona> => {
    return this.personaRepository.create(persona)
  }

  public update = async (id: string, persona: NewPersona): Promise<Persona> => {
    return this.personaRepository.update(id, persona)
  }

  public delete = async (id: string): Promise<void> => {
    return this.personaRepository.delete(id)
  }

  public getIdBySlug = async (slug: string): Promise<string> => {
    return this.personaRepository.findIdBySlug(slug)
  }
}

export default PersonaService
