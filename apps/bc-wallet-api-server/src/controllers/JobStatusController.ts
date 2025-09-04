import { JobStatusResponse } from 'bc-wallet-openapi'
import { Authorized, Get, JsonController, OnUndefined, Param, Post, QueryParam } from 'routing-controllers'
import { Service } from 'typedi'

import JobStatusService from '../services/JobStatusService'
import { getBasePath } from '../utils/auth'
import { jobStatusDTOFrom } from '../utils/mappers'

@JsonController(getBasePath('/job-status'))
@Service()
export class JobStatusController {
  public constructor(private readonly jobStatusService: JobStatusService) {}

  @Authorized()
  @OnUndefined(204)
  @Post('/entity/pending/:id')
  public async executePendingJobs(@Param('id') jobIds: string): Promise<void> {
    try {
      await this.jobStatusService.executePendingJobs(jobIds)
    } catch (e) {
      console.error('executePendingJobs failed:', e)
      return Promise.reject(e)
    }
  }

  @Get('/entity/:entityType/:status')
  public async getAllByEntity(
    @Param('entityType') entityType: string,
    @Param('status') status: string,
  ): Promise<JobStatusResponse> {
    try {
      const result = await this.jobStatusService.getJobStatusByEntity(entityType, status)
      const jobStatus = result.map((jobStatus) => jobStatusDTOFrom(jobStatus))

      return { jobStatus }
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error('getAll JobStatus failed:', e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/')
  public async getAll(@QueryParam('status') status?: string): Promise<JobStatusResponse> {
    try {
      const result = await this.jobStatusService.getAllJobStatus(status)
      const jobStatus = result.map((jobStatus) => jobStatusDTOFrom(jobStatus))
      return { jobStatus }
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error('getAll JobStatus failed:', e)
      }
      return Promise.reject(e)
    }
  }
}
