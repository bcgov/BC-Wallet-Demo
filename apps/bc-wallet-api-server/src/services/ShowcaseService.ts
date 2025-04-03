import { Service } from 'typedi'
import ShowcaseRepository from '../database/repositories/ShowcaseRepository'
import { Showcase, NewShowcase } from '../types'

@Service()
class ShowcaseService {
  constructor(private readonly showcaseRepository: ShowcaseRepository) {}

  public getShowcases = async (): Promise<Showcase[]> => {
    return this.showcaseRepository.findAll()
  }

  public getUnapproved() {
    return this.showcaseRepository.findUnapproved()
  }

  public getShowcase = async (id: string): Promise<Showcase> => {
    return this.showcaseRepository.findById(id)
  }

  public createShowcase = async (showcase: NewShowcase): Promise<Showcase> => {
    return this.showcaseRepository.create(showcase)
  }

  public updateShowcase = async (id: string, showcase: NewShowcase): Promise<Showcase> => {
    return this.showcaseRepository.update(id, showcase)
  }

  public deleteShowcase = async (id: string): Promise<void> => {
    return this.showcaseRepository.delete(id)
  }

  public getIdBySlug = async (slug: string): Promise<string> => {
    return this.showcaseRepository.findIdBySlug(slug)
  }


  /**
   * Approves a specific showcase by its ID.
   * @param id The ID of the showcase to approve.
   * @returns The updated Showcase object.
   * @throws NotFoundError if the showcase doesn't exist.
   * @throws Error if the current user cannot be determined (implementation specific).
   */
  public approveShowcase = async (id: string): Promise<Showcase> => {
    const currentUserId = '00000000-0000-0000-0000-000000000001' //  <<< REPLACE THIS with actual user ID when authentication is ready

    if (!currentUserId) {
      return Promise.reject(new Error('Could not determine the approving user.'))
    }

    return this.showcaseRepository.approve(id, currentUserId)
  }


  /**
   * Approves a specific showcase identified by its slug.
   * This is useful if your controller primarily uses slugs.
   * @param slug The slug of the showcase to approve.
   * @returns The updated Showcase object.
   * @throws NotFoundError if the showcase doesn't exist.
   * @throws Error if the current user cannot be determined (implementation specific).
   */
  public approveShowcaseBySlug = async (slug: string): Promise<Showcase> => {
    const currentUserId = '00000000-0000-0000-0000-000000000001' //  <<< REPLACE THIS with actual user ID when authentication is ready
    if (!currentUserId) {
      return Promise.reject(new Error('Could not determine the approving user.'))
    }

    const showcaseId = await this.showcaseRepository.findIdBySlug(slug)
    return this.showcaseRepository.approve(showcaseId, currentUserId)
  }
}

export default ShowcaseService
