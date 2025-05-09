import { Service } from 'typedi'

import { UserRepository } from '../database/repositories/UserRepository'
import type { NewUser, User } from '../types'

@Service()
class UserService {
  public constructor(private readonly userRepository: UserRepository) {}

  public getUsers = async (): Promise<User[]> => {
    return this.userRepository.findAll()
  }

  public getUser = async (id: string): Promise<User> => {
    return this.userRepository.findById(id)
  }

  public getUserByName = async (userName: string): Promise<User> => {
    return this.userRepository.findByUserAndTenantId(userName)
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
