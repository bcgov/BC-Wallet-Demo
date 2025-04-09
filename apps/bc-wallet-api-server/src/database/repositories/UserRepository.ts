import { eq } from 'drizzle-orm'
import { Service } from 'typedi'

import { NotFoundError } from '../../errors'
import { DatabaseService } from '../../services/DatabaseService'
import type { NewUser, RepositoryDefinition, User } from '../../types'
import { users } from '../schema'

@Service()
export class UserRepository implements RepositoryDefinition<User, NewUser> {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(user: NewUser): Promise<User> {
    const [result] = await (await this.databaseService.getConnection()).insert(users).values(user).returning()

    return result
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(users).where(eq(users.id, id))
  }

  async update(id: string, user: NewUser): Promise<User> {
    await this.findById(id)
    const [result] = await (await this.databaseService.getConnection())
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning()

    return result
  }

  async findById(id: string): Promise<User> {
    const [result] = await (await this.databaseService.getConnection()).select().from(users).where(eq(users.id, id))

    if (!result) {
      return Promise.reject(new NotFoundError(`No user found for id: ${id}`))
    }

    return result
  }

  async findByUserName(userName: string): Promise<User> {
    const [result] = await (await this.databaseService.getConnection())
      .select()
      .from(users)
      .where(eq(users.userName, userName))

    if (!result) {
      return Promise.reject(new NotFoundError(`No user found for userName: ${userName}`))
    }

    return result
  }

  async findAll(): Promise<User[]> {
    return (await this.databaseService.getConnection()).select().from(users)
  }
}
