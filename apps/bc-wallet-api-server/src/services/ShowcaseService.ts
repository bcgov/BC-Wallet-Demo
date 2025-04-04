import { Inject, Service } from 'typedi'
import ShowcaseRepository from '../database/repositories/ShowcaseRepository'
import { NewShowcase, Showcase } from '../types'
import { ISessionService } from '../types/services/session'
import CredentialDefinitionService from './CredentialDefinitionService'

@Service()
class ShowcaseService {
  constructor(
    private readonly showcaseRepository: ShowcaseRepository,
    private credentialDefinitionService: CredentialDefinitionService,
    @Inject('ISessionService') private readonly sessionService: ISessionService,
  ) {}

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
    const currentUser = await this.sessionService.getCurrentUser()
    if (!currentUser) {
      return Promise.reject(new Error('Could not determine the approving user.'))
    }

    return this.showcaseRepository.approve(id, currentUser.id)
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
    const currentUser = await this.sessionService.getCurrentUser()
    if (!currentUser) {
      throw new Error('Could not determine the approving user.')
    }

    const showcaseId = await this.showcaseRepository.findIdBySlug(slug)
    const showCase = await this.showcaseRepository.findById(showcaseId)

    for (const scenario of showCase.scenarios || []) {
      for (const step of scenario.steps || []) {
        if (
          step.credentialDefinition &&
          !(await this.credentialDefinitionService.isApproved(step.credentialDefinition))
        ) {
          return Promise.reject(
            Error(
              `Credential definition id ${step.credentialDefinition} used by step ${step.id} / ${step.title} in showcase ${slug} is not approved yet.`,
            ),
          )
        }
      }
    }

    return this.showcaseRepository.approve(showcaseId, currentUser.id)
  }

  public isApproved = async (id: string): Promise<boolean> => {
    const showcase = await this.showcaseRepository.findById(id)
    return showcase.approvedBy !== undefined && showcase.approvedBy !== null
  }
}

export default ShowcaseService
