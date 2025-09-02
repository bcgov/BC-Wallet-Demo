import { Inject, Service } from 'typedi'

import JobEntityMapRepository from '../database/repositories/JobEntityMapRepository'
import JobStatusRepository from '../database/repositories/JobStatusRepository'
import { JobStatus } from '../types/jobStatus'
import type { ISessionService } from '../types/services/session'
import { AbstractAdapterClientService } from './AbstractAdapterClientService'
import TenantService from './TenantService'

/**
 * Service for managing credential schemas.
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
    private readonly jobStatusRepository: JobStatusRepository,
    private readonly jobEntityMapRepository: JobEntityMapRepository,
    tenantService: TenantService,
  ) {
    super(sessionService, tenantService)
  }

  /**
   * Retrieves all credential schemas.
   * @returns Promise resolving to an array of CredentialSchema objects
   */
  public getJobStatusByEntity = async (entityType: string, status: string): Promise<JobStatus[]> => {
    const jobEntityResponse = await this.jobEntityMapRepository.findByEntityType(entityType, status)

    const jobStatusResponse: JobStatus[] = []
    for await (const jem of jobEntityResponse) {
      jobStatusResponse.push(await this.jobStatusRepository.findById(jem.jobId))
    }
    // Filter out any credential schemas that are still pending creation
    return jobStatusResponse
  }
}

export default JobStatusService
