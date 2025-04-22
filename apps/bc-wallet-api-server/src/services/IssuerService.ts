import { AdapterClientApi } from 'bc-wallet-adapter-client-api'
import { SendOptions } from 'bc-wallet-adapter-client-api'
import { Inject, Service } from 'typedi'

import IssuerRepository from '../database/repositories/IssuerRepository'
import type { Issuer, NewIssuer } from '../types'
import type { ISessionService } from '../types/services/session'
import { issuerDTOFrom } from '../utils/mappers'

@Service()
class IssuerService {
  private readonly adapterClientApi: AdapterClientApi = new AdapterClientApi() // FIXME should be injected in constructor

  public constructor(
    private readonly issuerRepository: IssuerRepository,
    // private readonly adapterClientApi: AdapterClientApi, FIXME not loading
    @Inject('ISessionService') private readonly sessionService: ISessionService,
  ) {}

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

  private buildSendOptions(): SendOptions {
    return {
      authHeader: this.sessionService.getBearerToken(),
      showcaseApiUrlBase: this.sessionService.getApiBaseUrl(),
    }
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
