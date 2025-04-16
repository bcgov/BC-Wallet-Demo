import { Service } from 'typedi'
import RelyingPartyRepository from '../database/repositories/RelyingPartyRepository'
import { RelyingParty, NewRelyingParty } from '../types'

@Service()
class RelyingPartyService {
  constructor(private readonly relyingPartyRepository: RelyingPartyRepository) {}

  public getRelyingParties = async (): Promise<RelyingParty[]> => {
    return this.relyingPartyRepository.findAll()
  }

  public getRelyingParty = async (id: string): Promise<RelyingParty> => {
    return this.relyingPartyRepository.findById(id)
  }

  public createRelyingParty = async (relyingParty: NewRelyingParty): Promise<RelyingParty> => {
    return this.relyingPartyRepository.create(relyingParty)
  }

  public updateRelyingParty = async (id: string, relyingParty: NewRelyingParty): Promise<RelyingParty> => {
    return this.relyingPartyRepository.update(id, relyingParty)
  }

  public deleteRelyingParty = async (id: string): Promise<void> => {
    return this.relyingPartyRepository.delete(id)
  }
}

export default RelyingPartyService
