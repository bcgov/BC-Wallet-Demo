import { IAdapterClientApi } from 'bc-wallet-adapter-client-api'
import { Inject, Service } from 'typedi'

import IssuerRepository from '../database/repositories/IssuerRepository'
import type { Issuer, NewIssuer } from '../types'
import type { ISessionService } from '../types/services/session'
import { issuerDTOFrom } from '../utils/mappers'
import { AbstractAdapterClientService } from './AbstractAdapterClientService'

@Service()
class IssuerService extends AbstractAdapterClientService {
  public constructor(
    private readonly issuerRepository: IssuerRepository,
    @Inject('ISessionService') sessionService: ISessionService,
    @Inject('IAdapterClientApi') private readonly adapterClientApi: IAdapterClientApi,
  ) {
    super(sessionService)
  }

  public getIssuers = async (): Promise<Issuer[]> => {
    return this.issuerRepository.findAll()
  }

  public getIssuer = async (id: string): Promise<Issuer> => {
    return this.issuerRepository.findById(id)
  }

  public createIssuer = async (newIssuer: NewIssuer): Promise<Issuer> => {
    const createdIssuer = await this.issuerRepository.create(newIssuer)
    void (await this.adapterClientApi.publishIssuer(issuerDTOFrom(createdIssuer), this.buildSendOptions()))
    return createdIssuer
  }

  public updateIssuer = async (id: string, newIssuer: NewIssuer): Promise<Issuer> => {
    const updatedIssuer = await this.issuerRepository.update(id, newIssuer)
    void (await this.adapterClientApi.publishIssuer(issuerDTOFrom(updatedIssuer), this.buildSendOptions()))
    return updatedIssuer
  }

  public deleteIssuer = async (id: string): Promise<void> => {
    return this.issuerRepository.delete(id)
  }
}

export default IssuerService
