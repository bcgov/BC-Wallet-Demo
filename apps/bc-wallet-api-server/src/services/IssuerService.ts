import { IAdapterClientApi } from 'bc-wallet-adapter-client-api'
import { randomUUID } from 'crypto'
import { Inject, Service } from 'typedi'

import IssuerRepository from '../database/repositories/IssuerRepository'
import JobEntityMapRepository from '../database/repositories/JobEntityMapRepository'
import JobStatusRepository from '../database/repositories/JobStatusRepository'
import type { Issuer, NewIssuer } from '../types'
import type { ISessionService } from '../types/services/session'
import { issuerDTOFrom } from '../utils/mappers'
import { AbstractAdapterClientService } from './AbstractAdapterClientService'
import CredentialSchemaService from './CredentialSchemaService'
import TenantService from './TenantService'

@Service()
class IssuerService extends AbstractAdapterClientService {
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
    return this.issuerRepository.findAll()
  }

  public getIssuer = async (id: string): Promise<Issuer> => {
    return this.issuerRepository.findById(id)
  }

  public createIssuer = async (newIssuer: NewIssuer): Promise<Issuer> => {
    const createdIssuer = await this.issuerRepository.create(newIssuer)
    void (await this.adapterClientApi.publishIssuer(issuerDTOFrom(createdIssuer), await this.buildSendOptions()))
    return createdIssuer
  }

  public updateIssuer = async (id: string, newIssuer: NewIssuer): Promise<Issuer> => {
    const schemaId = newIssuer.credentialSchemas[0]

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
    await this.jobEntityMapRepository.create({
      jobId: jobDetails.jobId as unknown as string,
      entityType: 'updateIssuer',
      entityId: randomUUID(),
      status: 'pending',
      action: 'create',
    })
    const updatedIssuer = await this.issuerRepository.update(id, newIssuer)
    updatedIssuer.jobId = jobDetails.jobId as unknown as string
    void (await this.adapterClientApi.publishIssuer(issuerDTOFrom(updatedIssuer), await this.buildSendOptions()))
    return updatedIssuer
  }

  public publishIssuer = async (id: string): Promise<void> => {
    const issuer = await this.issuerRepository.findById(id)
    void (await this.adapterClientApi.publishIssuer(issuerDTOFrom(issuer), await this.buildSendOptions()))
  }

  public deleteIssuer = async (id: string): Promise<void> => {
    return this.issuerRepository.delete(id)
  }
}

export default IssuerService
