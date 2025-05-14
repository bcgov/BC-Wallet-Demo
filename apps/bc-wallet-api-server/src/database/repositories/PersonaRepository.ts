import { eq } from 'drizzle-orm'
import { NotFoundError } from 'routing-controllers'
import { Service } from 'typedi'

import DatabaseService from '../../services/DatabaseService'
import { NewPersona, Persona, RepositoryDefinition, Tx } from '../../types'
import { generateSlug } from '../../utils/slug'
import { personas } from '../schema'
import AssetRepository from './AssetRepository'

@Service()
class PersonaRepository implements RepositoryDefinition<Persona, NewPersona> {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly assetRepository: AssetRepository,
  ) {}

  async create(persona: NewPersona): Promise<Persona> {
    const headshotImageResult = persona.headshotImage
      ? await this.assetRepository.findById(persona.headshotImage)
      : null
    const bodyImageResult = persona.bodyImage ? await this.assetRepository.findById(persona.bodyImage) : null
    const connection = await this.databaseService.getConnection()
    const slug = await generateSlug({
      value: persona.name,
      connection,
      schema: personas,
    })

    const [result] = await connection
      .insert(personas)
      .values({
        ...persona,
        slug,
        headshotImage: headshotImageResult ? headshotImageResult.id : null,
        bodyImage: bodyImageResult ? bodyImageResult.id : null,
      })
      .returning()

    return {
      ...result,
      bodyImage: bodyImageResult,
      headshotImage: headshotImageResult,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      hidden: result.hidden,
    }
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(personas).where(eq(personas.id, id))
  }

  async update(id: string, persona: NewPersona): Promise<Persona> {
    await this.findById(id)
    const headshotImageResult = persona.headshotImage
      ? await this.assetRepository.findById(persona.headshotImage)
      : null
    const bodyImageResult = persona.bodyImage ? await this.assetRepository.findById(persona.bodyImage) : null
    const connection = await this.databaseService.getConnection()
    const slug = await generateSlug({
      value: persona.name,
      id,
      connection,
      schema: personas,
    })

    const [result] = await connection
      .update(personas)
      .set({
        ...persona,
        slug,
        headshotImage: headshotImageResult ? headshotImageResult.id : null,
        bodyImage: bodyImageResult ? bodyImageResult.id : null,
      })
      .where(eq(personas.id, id))
      .returning()

    return {
      ...result,
      bodyImage: bodyImageResult,
      headshotImage: headshotImageResult,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      hidden: result.hidden,
    }
  }

  async findById(id: string, tx?: Tx): Promise<Persona> {
    const result = await (tx ?? (await this.databaseService.getConnection())).query.personas.findFirst({
      where: eq(personas.id, id),
      with: {
        headshotImage: true,
        bodyImage: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No persona found for id: ${id}`))
    }

    return result
  }

  async findAll(): Promise<Persona[]> {
    return (await this.databaseService.getConnection()).query.personas.findMany({
      with: {
        headshotImage: true,
        bodyImage: true,
      },
    })
  }

  async findIdBySlug(slug: string): Promise<string> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.personas.findFirst({
      where: eq(personas.slug, slug),
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No persona found for slug: ${slug}`))
    }

    return result.id
  }
}

export default PersonaRepository
