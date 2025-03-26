import { eq } from 'drizzle-orm'
import { Service } from 'typedi'
import DatabaseService from '../../services/DatabaseService'
import { NotFoundError } from '../../errors'
import { users } from '../schema'
import { User, NewUser, RepositoryDefinition } from '../../types'

@Service()
class UserRepository implements RepositoryDefinition<User, NewUser> {
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
    const [result] = await (await this.databaseService.getConnection()).update(users).set(user).where(eq(users.id, id)).returning()

    return result
  }

  async findById(id: string): Promise<User> {
    const [result] = await (await this.databaseService.getConnection()).select().from(users).where(eq(users.id, id))

    if (!result) {
      return Promise.reject(new NotFoundError(`No user found for id: ${id}`))
    }

    return result
  }

  async findAll(): Promise<User[]> {
    return (await this.databaseService.getConnection()).select().from(users)
  }
}

export default UserRepository
