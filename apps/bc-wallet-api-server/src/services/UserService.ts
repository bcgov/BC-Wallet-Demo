import { Service } from 'typedi'
import { User, NewUser } from '../types'
import UserRepository from '../database/repositories/UserRepository'

@Service()
class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  public getUsers = async (): Promise<User[]> => {
    return this.userRepository.findAll()
  }

  public getUser = async (id: string): Promise<User> => {
    return this.userRepository.findById(id)
  }

  public createUser = async (user: NewUser): Promise<User> => {
    return this.userRepository.create(user)
  }

  public updateUser = async (id: string, user: NewUser): Promise<User> => {
    return this.userRepository.update(id, user)
  }

  public deleteUser = async (id: string): Promise<void> => {
    return this.userRepository.delete(id)
  }

  public insertIfNotExists = async (user: NewUser) => {
    if (!user.id) {
      throw new Error('User id is required')
    }
    try {
      return await this.userRepository.findById(user.id)
    } catch (e) {
      return await this.userRepository.create(user)
    }
  }
}

export default UserService
