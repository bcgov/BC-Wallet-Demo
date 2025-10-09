import { IAdapterClientApi } from 'bc-wallet-adapter-client-api'
import { CredentialDefinitionImportRequest, CredentialSchemaImportRequest } from 'bc-wallet-openapi'
import { Inject, Service } from 'typedi'

import IssuerRepository from '../database/repositories/IssuerRepository'
import JobEntityMapRepository from '../database/repositories/JobEntityMapRepository'
import JobStatusRepository from '../database/repositories/JobStatusRepository'
import { JobStatus } from '../types/jobStatus'
import type { ISessionService } from '../types/services/session'
import { createRequestLogger } from '../utils/logger'
import { issuerDTOFrom } from '../utils/mappers'
import { AbstractAdapterClientService } from './AbstractAdapterClientService'
import TenantService from './TenantService'

/**
 * Handles CRUD operations and integration with adapter client API.
 * Extends AbstractAdapterClientService for session functionality.
 */
@Service()
class JobStatusService extends AbstractAdapterClientService {
  private readonly logger = createRequestLogger('JobStatusService')
  
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
    private readonly issuerRepository: IssuerRepository,
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
        this.logger.info({ jobId: job.jobId }, `Executing job ${job.jobId}`)
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
          }
          if (job.apiName === 'importCredentialDefinition') {
            const importRequest: CredentialSchemaImportRequest = {
              identifierType: 'DID',
              identifier: job.payloadData.identifier,
              name: job.payloadData.name,
              version: job.payloadData.version,
              jobId: job.jobId,
            }

            await this.adapterClientApi.importCredentialSchema(importRequest, await this.buildSendOptions())
          }

          if (job.apiName === 'updateIssuer') {
            const issuer = await this.issuerRepository.findById(job.payloadData.issuerId)
            const issuerWithJobId = { ...issuer, jobId: job.jobId }

            await this.adapterClientApi.publishIssuer(issuerDTOFrom(issuerWithJobId), await this.buildSendOptions())
          }
        } catch (error) {
          this.logger.error({ error, jobId: job.jobId }, `Error executing job ${job.jobId}`)
        }
      }
    })
  }

  public async updateJobStatus(id: string, status: string): Promise<JobStatus> {
    const jobStatus = await this.jobStatusRepository.findById(id)
    if (!jobStatus) {
      throw new Error(`Job with ID ${id} not found`)
    }

    await this.jobStatusRepository.update(id, { status })

    // Update corresponding JobEntityMap status
    const jobEntities = await this.jobEntityMapRepository.findByJobId(id)
    for (const jobEntity of jobEntities) {
      jobEntity.status = status
      await this.jobEntityMapRepository.updateStatus(jobEntity.jobId as unknown as string, jobEntity)
      this.logger.info({ id, status }, `JobEntityMap for job ${id} updated to status ${status}`)
    }

    return jobStatus
  }
}

export default JobStatusService
