import { JobStatusResponse } from 'bc-wallet-openapi'
import { Get, JsonController, Param } from 'routing-controllers'
import { Service } from 'typedi'

import JobStatusService from '../services/JobStatusService'
import { getBasePath } from '../utils/auth'
import { jobStatusDTOFrom } from '../utils/mappers'

@JsonController(getBasePath('/job-status'))
@Service()
export class JobStatusController {
  public constructor(private readonly jobStatusService: JobStatusService) {}

  @Get('/entity/:entityType/:status')
  public async getAllByEntity(
    @Param('entityType') entityType: string,
    @Param('status') status: string,
  ): Promise<JobStatusResponse> {
    try {
      const result = await this.jobStatusService.getJobStatusByEntity(entityType, status)
      console.log('Result from getJobStatusByEntity:', result)
      const jobStatus = result.map((jobStatus) => jobStatusDTOFrom(jobStatus))
      console.log('Mapped JobStatus DTOs:', jobStatus)
      // console.log('Returning JobStatusResponse:', JobStatusResponseFromJSONTyped({ jobStatus }, true))
      return { jobStatus }
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error('getAll JobStatus failed:', e)
      }
      return Promise.reject(e)
    }
  }
}
