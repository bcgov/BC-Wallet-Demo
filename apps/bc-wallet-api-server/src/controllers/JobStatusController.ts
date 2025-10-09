import { JobStatusResponse } from 'bc-wallet-openapi'
import { Authorized, Body, Get, JsonController, OnUndefined, Param, Patch, Post, QueryParam } from 'routing-controllers'
import { Inject, Service } from 'typedi'

import JobStatusService from '../services/JobStatusService'
import { createRequestLogger } from '../utils/logger'
import { getBasePath } from '../utils/auth'
import { jobStatusDTOFrom } from '../utils/mappers'

export class JobStatusUpdate {
  status: string
}

@JsonController('/jobs')
export class JobStatusController {
  private readonly logger = createRequestLogger('JobStatusController')

  constructor(@Inject() private jobStatusService: JobStatusService) {}

  @Authorized()
  @OnUndefined(204)
  @Post('/entity/pending/:id')
  public async executePendingJobs(@Param('id') jobIds: string): Promise<void> {
    try {
      await this.jobStatusService.executePendingJobs(jobIds)
    } catch (e) {
      this.logger.error({ error: e }, 'executePendingJobs failed')
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
        this.logger.error({ error: e, entityType, status }, 'getJobStatusByEntity failed')
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
        this.logger.error({ error: e, status }, 'getAll JobStatus failed')
      }
      return Promise.reject(e)
    }
  }

  @Patch('/:id')
  public async updateJobStatus(
    @Param('id') id: string,
    @Body() jobStatusUpdate: JobStatusUpdate,
  ): Promise<JobStatusResponse> {
    try {
      const updatedJobStatus = await this.jobStatusService.updateJobStatus(id, jobStatusUpdate.status)
      return { jobStatus: [jobStatusDTOFrom(updatedJobStatus)] }
    } catch (e) {
      this.logger.error({ error: e, id, jobStatusUpdate }, 'updateJobStatus failed')
      return Promise.reject(e)
    }
  }
}
