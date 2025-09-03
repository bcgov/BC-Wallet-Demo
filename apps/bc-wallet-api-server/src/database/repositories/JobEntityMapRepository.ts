import { eq, and } from 'drizzle-orm'
import { Service } from 'typedi'

import DatabaseService from '../../services/DatabaseService'
import { RepositoryDefinition } from '../../types'
import { JobEntityMap, NewJobEntityMap } from '../../types/jobEntityMap'
import { jobEntityMap } from '../schema/jobEntityMap'

@Service()
class JobEntityMapRepository implements RepositoryDefinition<JobEntityMap, NewJobEntityMap> {
  public constructor(private readonly db: DatabaseService) {}

  public findById(id: string): Promise<JobEntityMap> {
    throw new Error('Method not implemented.')
  }
  public findAll(filter?: Record<string, any>): Promise<JobEntityMap[]> {
    throw new Error('Method not implemented.')
  }
  public update(id: string, item: NewJobEntityMap): Promise<JobEntityMap> {
    throw new Error('Method not implemented.')
  }

  public async create(data: NewJobEntityMap): Promise<JobEntityMap> {
    const [result] = await (await this.db.getConnection()).insert(jobEntityMap).values(data).returning()
    return { ...result, createdAt: result?.createdAt ?? new Date(), status: result?.status ?? 'pending' }
  }

  public async findByJobId(jobId: string): Promise<JobEntityMap[]> {
    const result = await (await this.db.getConnection())
      .select()
      .from(jobEntityMap)
      .where(eq(jobEntityMap.jobId, jobId))
    if (!result) {
      throw new Error(`JobEntityMap with id ${jobId} not found`)
    }
    return (result ?? []).map((item) => ({
      ...item,
      status: item.status ?? 'pending',
      createdAt: item.createdAt ?? new Date(),
    }))
  }

  public async findByEntityType(entityType: string, status?: string): Promise<JobEntityMap[]> {
    const db = await this.db.getConnection()
    const condition =
      status !== undefined
        ? and(eq(jobEntityMap.entityType, entityType), eq(jobEntityMap.status, status))
        : eq(jobEntityMap.entityType, entityType)
    const result = await db.select().from(jobEntityMap).where(condition)
    if (!result) {
      throw new Error(`JobEntityMap with type ${entityType} not found`)
    }
    return (result ?? []).map((item) => ({
      ...item,
      status: item.status ?? 'pending',
      createdAt: item.createdAt ?? new Date(),
    }))
  }

  public async findByEntity(entityType: string, entityId: string): Promise<JobEntityMap[]> {
    const result = await (
      await this.db.getConnection()
    )
      .select()
      .from(jobEntityMap)
      .where(and(eq(jobEntityMap.entityType, entityType), eq(jobEntityMap.entityId, entityId)))
    return (result ?? []).map((item) => ({
      ...item,
      status: item.status ?? 'pending',
      createdAt: item.createdAt ?? new Date(),
    }))
  }

  public async findByStatus(status?: string): Promise<JobEntityMap[]> {
    const condition = status ? eq(jobEntityMap.status, status) : undefined
    const result = await (await this.db.getConnection()).select().from(jobEntityMap).where(condition)
    return (result ?? []).map((item) => ({
      ...item,
      status: item.status ?? 'pending',
      createdAt: item.createdAt ?? new Date(),
    }))
  }

  public async updateStatus(jobId: string, data: Partial<JobEntityMap>): Promise<JobEntityMap | null> {
    const [result] = await (
      await this.db.getConnection()
    )
      .update(jobEntityMap)
      .set({ ...data })
      .where(eq(jobEntityMap.jobId, jobId))
      .returning()
    return result
      ? {
          ...result,
          status: result.status ?? 'pending',
          createdAt: result.createdAt ?? new Date(),
        }
      : null
  }

  public async delete(jobId: string): Promise<void> {
    await (await this.db.getConnection()).delete(jobEntityMap).where(eq(jobEntityMap.jobId, jobId)).returning()
  }
}

export default JobEntityMapRepository
