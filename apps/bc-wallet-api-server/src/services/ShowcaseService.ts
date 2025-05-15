import { BadRequestError, ForbiddenError, InternalServerError } from 'routing-controllers'
import { Inject, Service } from 'typedi'

import ShowcaseRepository from '../database/repositories/ShowcaseRepository'
import { NewShowcase, Showcase } from '../types'
import { ISessionService } from '../types/services/session'
import CredentialDefinitionService from './CredentialDefinitionService'

@Service()
class ShowcaseService {
  public constructor(
    private readonly showcaseRepository: ShowcaseRepository,
    private credentialDefinitionService: CredentialDefinitionService,
    @Inject('ISessionService') private readonly sessionService: ISessionService,
  ) {}

  public getShowcases = async (): Promise<Showcase[]> => {
    return this.showcaseRepository.findAll(this.getTenantId())
  }

  public getUnapproved() {
    return this.showcaseRepository.findUnapproved(this.getTenantId())
  }

  public getShowcase = async (id: string): Promise<Showcase> => {
    return this.showcaseRepository.findById(id)
  }

  public createShowcase = async (showcase: NewShowcase): Promise<Showcase> => {
    const tenantId = this.getTenantId()
    if (!showcase.tenantId) {
      showcase.tenantId = tenantId
    } else if (showcase.tenantId !== tenantId) {
      throw new ForbiddenError(
        `The showcase is being created for tenant ${showcase.tenantId}, but the signed in tenant is ${tenantId}.`,
      )
    }
    return this.showcaseRepository.create(showcase)
  }

  public updateShowcase = async (id: string, showcase: NewShowcase): Promise<Showcase> => {
    const tenantId = this.getTenantId()
    if (!showcase.tenantId) {
      showcase.tenantId = tenantId
    } else if (showcase.tenantId !== tenantId) {
      throw new ForbiddenError(
        `The showcase is being updated for tenant ${showcase.tenantId}, but the signed in tenant is ${tenantId}.`,
      )
    }
    return this.showcaseRepository.update(id, showcase)
  }

  public deleteShowcase = async (id: string): Promise<void> => {
    const tenantId = this.getTenantId()
    const existingShowcase = await this.showcaseRepository.findById(id)
    if (existingShowcase) {
      if (existingShowcase.tenantId !== tenantId)
        return Promise.reject(
          new ForbiddenError(
            `The showcase is being deleted for tenant ${existingShowcase.tenantId}, but the signed in tenant is ${tenantId}.`,
          ),
        )
    } else {
      return
    }

    return this.showcaseRepository.delete(id)
  }

  public getIdBySlug = async (slug: string): Promise<string> => {
    const tenantId = this.getTenantId()
    return this.showcaseRepository.findIdBySlug(slug, tenantId)
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
    const tenantId = this.getTenantId()
    return this.showcaseRepository.approve(id, tenantId, currentUser.id)
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
    const tenantId = this.getTenantId()

    const showcaseId = await this.showcaseRepository.findIdBySlug(slug, tenantId)
    const showCase = await this.showcaseRepository.findById(showcaseId)

    for (const scenario of showCase.scenarios || []) {
      for (const step of scenario.steps || []) {
        for (const stepAction of step.actions || []) {
          if (
            'credentialDefinitionId' in stepAction &&
            stepAction.credentialDefinitionId &&
            !(await this.credentialDefinitionService.isApproved(stepAction.credentialDefinitionId))
          ) {
            return Promise.reject(
              new BadRequestError(
                `Credential definition id ${stepAction.credentialDefinitionId} used by step ${step.id} / ${step.title} in showcase ${slug} is not approved yet.`,
              ),
            )
          }
        }
      }
    }

    return this.showcaseRepository.approve(showcaseId, tenantId, currentUser.id)
  }

  public isApproved = async (id: string): Promise<boolean> => {
    const showcase = await this.showcaseRepository.findById(id)
    return showcase.approvedBy !== undefined && showcase.approvedBy !== null
  }

  private getTenantId() {
    const currentTenant = this.sessionService.getCurrentTenant()
    if (!currentTenant) {
      const urlTenantId = this.sessionService.getUrlTenantId()
      if (!urlTenantId) {
        throw new InternalServerError('Tenant details are missing')
      }
      return urlTenantId
    }
    return currentTenant.id
  }
}

export default ShowcaseService
