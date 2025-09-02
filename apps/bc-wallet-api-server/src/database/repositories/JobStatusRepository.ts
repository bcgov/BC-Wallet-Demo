import { eq } from 'drizzle-orm'
import { Service } from 'typedi'

import DatabaseService from '../../services/DatabaseService'
import { RepositoryDefinition } from '../../types'
import { JobStatus, NewJobStatus } from '../../types/jobStatus'
import { jobStatus } from '../schema/jobStatus'

@Service()
class JobStatusRepository implements RepositoryDefinition<JobStatus, NewJobStatus> {
  public constructor(private readonly db: DatabaseService) {}

  public async create(data: NewJobStatus): Promise<JobStatus> {
    const [result] = await (await this.db.getConnection()).insert(jobStatus).values(data).returning()
    return {
      ...result,
      errorMessage: result?.errorMessage ?? undefined,
      createdAt: result?.createdAt ?? new Date(),
      updatedAt: result?.updatedAt ?? new Date(),
    }
  }

  public async findById(jobId: string): Promise<JobStatus> {
    const [result] = await (await this.db.getConnection()).select().from(jobStatus).where(eq(jobStatus.jobId, jobId))
    if (!result) {
      throw new Error(`JobStatus with id ${jobId} not found`)
    }
    return { ...result, errorMessage: result.errorMessage ?? undefined }
  }

  public async update(id: string, item: Partial<JobStatus>): Promise<JobStatus> {
    const [result] = await (
      await this.db.getConnection()
    )
      .update(jobStatus)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(jobStatus.jobId, id))
      .returning()
    if (!result) {
      throw new Error(`JobStatus with id ${id} not found`)
    }
    return { ...result, errorMessage: result.errorMessage ?? undefined }
  }

  public async findAll(): Promise<JobStatus[]> {
    const results = await (await this.db.getConnection()).select().from(jobStatus)
    return results.map(result => ({
      ...result,
      errorMessage: result.errorMessage ?? undefined,
    }))
  }

  public async delete(id: string): Promise<void> {
    await (await this.db.getConnection()).delete(jobStatus).where(eq(jobStatus.jobId, id)).returning()
  }
}

export default JobStatusRepository
