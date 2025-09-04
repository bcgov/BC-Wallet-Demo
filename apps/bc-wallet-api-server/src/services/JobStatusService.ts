import { IAdapterClientApi } from 'bc-wallet-adapter-client-api'
import { CredentialDefinitionImportRequest, CredentialSchemaImportRequest } from 'bc-wallet-openapi'
import { Inject, Service } from 'typedi'

import JobEntityMapRepository from '../database/repositories/JobEntityMapRepository'
import JobStatusRepository from '../database/repositories/JobStatusRepository'
import { JobStatus } from '../types/jobStatus'
import type { ISessionService } from '../types/services/session'
import { AbstractAdapterClientService } from './AbstractAdapterClientService'
import TenantService from './TenantService'

/**
 * Handles CRUD operations and integration with adapter client API.
 * Extends AbstractAdapterClientService for session functionality.
 */
@Service()
class JobStatusService extends AbstractAdapterClientService {
  /**
   * Constructor for CredentialSchemaService.
   * @param sessionService Service for managing user sessions
   * @param adapterClientApi Client API for interacting with the wallet adapter
   * @param credentialSchemaRepository Repository for credential schema data access
   */
  public constructor(
    @Inject('ISessionService') sessionService: ISessionService,
    @Inject('IAdapterClientApi') private readonly adapterClientApi: IAdapterClientApi,
    private readonly jobStatusRepository: JobStatusRepository,
    private readonly jobEntityMapRepository: JobEntityMapRepository,
    tenantService: TenantService,
  ) {
    super(sessionService, tenantService)
  }

  public getAllJobStatus = async (status?: string): Promise<JobStatus[]> => {
    const jobEntityResponse = await this.jobEntityMapRepository.findByStatus(status)
    const jobStatusResponse: JobStatus[] = []
    for (const jem of jobEntityResponse) {
      jobStatusResponse.push(await this.jobStatusRepository.findById(jem.jobId))
    }
    return jobStatusResponse
  }

  public getJobStatusByEntity = async (entityType: string, status: string): Promise<JobStatus[]> => {
    const jobEntityResponse = await this.jobEntityMapRepository.findByEntityType(entityType, status)

    const jobStatusResponse: JobStatus[] = []
    for (const jem of jobEntityResponse) {
      jobStatusResponse.push(await this.jobStatusRepository.findById(jem.jobId))
    }
    // Filter out any credential schemas that are still pending creation
    return jobStatusResponse
  }

  public async executePendingJobs(jobIds: string): Promise<void> {
    jobIds.split(',').forEach(async (jobId) => {
      const jobEntityResponse = await this.jobEntityMapRepository.findByJobId(jobId)
      const jobStatusResponse: JobStatus[] = []
      for (const jem of jobEntityResponse) {
        jobStatusResponse.push(await this.jobStatusRepository.findById(jem.jobId))
      }

      for (const job of jobStatusResponse) {
        console.debug(`Executing job ${job.jobId}`)
        try {
          if (job.apiName === 'importCredentialDefinition') {
            const importRequest: CredentialDefinitionImportRequest = {
              identifierType: 'DID',
              identifier: job.payloadData.identifier,
              name: job.payloadData.name,
              version: job.payloadData.version,
              jobId: job.jobId,
            }

            await this.adapterClientApi.importCredentialDefinition(importRequest, await this.buildSendOptions())
          } else {
            const importRequest: CredentialSchemaImportRequest = {
              identifierType: 'DID',
              identifier: job.payloadData.identifier,
              name: job.payloadData.name,
              version: job.payloadData.version,
              jobId: job.jobId,
            }

            await this.adapterClientApi.importCredentialSchema(importRequest, await this.buildSendOptions())
          }
        } catch (error) {
          console.error(`Error executing job ${job.jobId}:`, error)
        }
      }
    })
  }
}

export default JobStatusService
