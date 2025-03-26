import { Service } from 'typedi'
import { User, NewUser } from '../types'
import UserRepository from '../database/repositories/UserRepository'

@Service()
class UserService {
  constructor(private readonly assetRepository: UserRepository) {}

  public getUsers = async (): Promise<User[]> => {
    return this.assetRepository.findAll()
  }

  public getUser = async (id: string): Promise<User> => {
    return this.assetRepository.findById(id)
  }

  public createUser = async (user: NewUser): Promise<User> => {
    return this.assetRepository.create(user)
  }

  public updateUser = async (id: string, user: NewUser): Promise<User> => {
    return this.assetRepository.update(id, user)
  }

  public deleteUser = async (id: string): Promise<void> => {
    return this.assetRepository.delete(id)
  }
}

export default UserService
