import { IAdapterClientApi } from 'bc-wallet-adapter-client-api'
import { randomUUID } from 'crypto'
import { Inject, Service } from 'typedi'

import IssuerRepository from '../database/repositories/IssuerRepository'
import JobEntityMapRepository from '../database/repositories/JobEntityMapRepository'
import JobStatusRepository from '../database/repositories/JobStatusRepository'
import type { Issuer, NewIssuer } from '../types'
import type { ISessionService } from '../types/services/session'
import { createRequestLogger } from '../utils/logger'
import { issuerDTOFrom } from '../utils/mappers'
import { AbstractAdapterClientService } from './AbstractAdapterClientService'
import CredentialSchemaService from './CredentialSchemaService'
import TenantService from './TenantService'

@Service()
class IssuerService extends AbstractAdapterClientService {
  private readonly logger = createRequestLogger('IssuerService')

  public constructor(
    private readonly issuerRepository: IssuerRepository,
    @Inject('ISessionService') sessionService: ISessionService,
    @Inject('IAdapterClientApi') private readonly adapterClientApi: IAdapterClientApi,
    private readonly jobStatusRepository: JobStatusRepository,
    private readonly jobEntityMapRepository: JobEntityMapRepository,
    private readonly schemaService: CredentialSchemaService,
    tenantService: TenantService,
  ) {
    super(sessionService, tenantService)
  }

  public getIssuers = async (): Promise<Issuer[]> => {
    this.logger.info('Retrieving all issuers')
    try {
      const issuers = await this.issuerRepository.findAll()
      this.logger.info({ count: issuers.length }, 'Successfully retrieved issuers')
      return issuers
    } catch (error) {
      this.logger.error({ error }, 'Failed to retrieve issuers')
      throw error
    }
  }

  public getIssuer = async (id: string): Promise<Issuer> => {
    this.logger.info({ issuerId: id }, 'Retrieving issuer by id')
    try {
      const issuer = await this.issuerRepository.findById(id)
      this.logger.info({ issuerId: id, issuerName: issuer.name }, 'Successfully retrieved issuer')
      return issuer
    } catch (error) {
      this.logger.error({ error, issuerId: id }, 'Failed to retrieve issuer')
      throw error
    }
  }

  public createIssuer = async (newIssuer: NewIssuer): Promise<Issuer> => {
    this.logger.info({ issuerName: newIssuer.name }, 'Creating new issuer')
    try {
      const createdIssuer = await this.issuerRepository.create(newIssuer)
      this.logger.info({ issuerId: createdIssuer.id, issuerName: createdIssuer.name }, 'Successfully created issuer')
      
      this.logger.debug({ issuerId: createdIssuer.id }, 'Publishing issuer to adapter')
      void (await this.adapterClientApi.publishIssuer(issuerDTOFrom(createdIssuer), await this.buildSendOptions()))
      
      return createdIssuer
    } catch (error) {
      this.logger.error({ error, issuerName: newIssuer.name }, 'Failed to create issuer')
      throw error
    }
  }

  public updateIssuer = async (id: string, newIssuer: NewIssuer): Promise<Issuer> => {
    this.logger.info({ issuerId: id, issuerName: newIssuer.name }, 'Updating issuer')
    try {
      const schemaId = newIssuer.credentialSchemas[0]
      this.logger.debug({ issuerId: id, schemaId }, 'Getting schema details for issuer update')

      const schemaDetails = await this.schemaService.getCredentialSchema(schemaId)
      const jobDetails = await this.jobStatusRepository.create({
        status: 'pending',
        apiName: 'updateIssuer',
        endpoint: '/roles/issuers',
        payloadData: JSON.stringify({
          name: schemaDetails.name,
          identifierType: 'DID',
          identifier: schemaDetails.identifier,
          version: schemaDetails.version,
          issuerId: id,
        }),
      })
      
      this.logger.debug({ issuerId: id, jobId: jobDetails.jobId }, 'Created job for issuer update')
      
      await this.jobEntityMapRepository.create({
        jobId: jobDetails.jobId as unknown as string,
        entityType: 'updateIssuer',
        entityId: randomUUID(),
        status: 'pending',
        action: 'create',
      })
      
      const updatedIssuer = await this.issuerRepository.update(id, newIssuer)
      const issuerWithJobId = { ...updatedIssuer, jobId: jobDetails.jobId as unknown as string }
      
      this.logger.info({ issuerId: id, jobId: issuerWithJobId.jobId }, 'Successfully updated issuer')
      this.logger.debug({ issuerId: id }, 'Publishing updated issuer to adapter')
      
      void (await this.adapterClientApi.publishIssuer(issuerDTOFrom(issuerWithJobId), await this.buildSendOptions()))
      return issuerWithJobId
    } catch (error) {
      this.logger.error({ error, issuerId: id }, 'Failed to update issuer')
      throw error
    }
  }

  public publishIssuer = async (id: string): Promise<void> => {
    this.logger.info({ issuerId: id }, 'Publishing issuer')
    try {
      const issuer = await this.issuerRepository.findById(id)
      this.logger.debug({ issuerId: id, issuerName: issuer.name }, 'Publishing issuer to adapter')
      void (await this.adapterClientApi.publishIssuer(issuerDTOFrom(issuer), await this.buildSendOptions()))
      this.logger.info({ issuerId: id }, 'Successfully published issuer')
    } catch (error) {
      this.logger.error({ error, issuerId: id }, 'Failed to publish issuer')
      throw error
    }
  }

  public deleteIssuer = async (id: string): Promise<void> => {
    this.logger.info({ issuerId: id }, 'Deleting issuer')
    try {
      await this.issuerRepository.delete(id)
      this.logger.info({ issuerId: id }, 'Successfully deleted issuer')
    } catch (error) {
      this.logger.error({ error, issuerId: id }, 'Failed to delete issuer')
      throw error
    }
  }
}

export default IssuerService
