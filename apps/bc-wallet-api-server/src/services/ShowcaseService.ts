import { BadRequestError, ForbiddenError, InternalServerError } from 'routing-controllers'
import { Inject, Service } from 'typedi'

import ShowcaseRepository from '../database/repositories/ShowcaseRepository'
import { NewShowcase, Showcase } from '../types'
import { ISessionService } from '../types/services/session'
import { createRequestLogger } from '../utils/logger'
import CredentialDefinitionService from './CredentialDefinitionService'

@Service()
class ShowcaseService {
  private readonly logger = createRequestLogger('ShowcaseService')

  public constructor(
    private readonly showcaseRepository: ShowcaseRepository,
    private credentialDefinitionService: CredentialDefinitionService,
    @Inject('ISessionService') private readonly sessionService: ISessionService,
  ) {}

  public getShowcases = async (): Promise<Showcase[]> => {
    const tenantId = this.getTenantId()
    this.logger.info({ tenantId }, 'Retrieving all showcases for tenant')
    try {
      const showcases = await this.showcaseRepository.findAll(tenantId)
      this.logger.info({ tenantId, count: showcases.length }, 'Successfully retrieved showcases')
      return showcases
    } catch (error) {
      this.logger.error({ error, tenantId }, 'Failed to retrieve showcases')
      throw error
    }
  }

  public getUnapproved() {
    const tenantId = this.getTenantId()
    this.logger.info({ tenantId }, 'Retrieving unapproved showcases for tenant')
    return this.showcaseRepository.findUnapproved(tenantId)
  }

  public getShowcase = async (id: string): Promise<Showcase> => {
    this.logger.info({ showcaseId: id }, 'Retrieving showcase by id')
    try {
      const showcase = await this.showcaseRepository.findById(id)
      this.logger.info({ showcaseId: id, slug: showcase.slug }, 'Successfully retrieved showcase')
      return showcase
    } catch (error) {
      this.logger.error({ error, showcaseId: id }, 'Failed to retrieve showcase')
      throw error
    }
  }

  public createShowcase = async (showcase: NewShowcase): Promise<Showcase> => {
    const tenantId = this.getTenantId()
    this.logger.info({ tenantId, showcaseName: showcase.name }, 'Creating new showcase')

    if (!showcase.tenantId) {
      showcase.tenantId = tenantId
      this.logger.debug({ tenantId }, 'Assigned tenant ID to showcase')
    } else if (showcase.tenantId !== tenantId) {
      this.logger.warn(
        { providedTenantId: showcase.tenantId, sessionTenantId: tenantId },
        'Tenant ID mismatch in showcase creation',
      )
      throw new ForbiddenError(
        `The showcase is being created for tenant ${showcase.tenantId}, but the signed in tenant is ${tenantId}.`,
      )
    }

    try {
      const createdShowcase = await this.showcaseRepository.create(showcase)
      this.logger.info(
        { showcaseId: createdShowcase.id, slug: createdShowcase.slug, tenantId },
        'Successfully created showcase',
      )
      return createdShowcase
    } catch (error) {
      this.logger.error({ error, showcaseName: showcase.name, tenantId }, 'Failed to create showcase')
      throw error
    }
  }

  public updateShowcase = async (id: string, showcase: NewShowcase): Promise<Showcase> => {
    const tenantId = this.getTenantId()
    this.logger.info({ showcaseId: id, tenantId, showcaseName: showcase.name }, 'Updating showcase')

    if (!showcase.tenantId) {
      showcase.tenantId = tenantId
      this.logger.debug({ showcaseId: id, tenantId }, 'Assigned tenant ID to showcase update')
    } else if (showcase.tenantId !== tenantId) {
      this.logger.warn(
        { showcaseId: id, providedTenantId: showcase.tenantId, sessionTenantId: tenantId },
        'Tenant ID mismatch in showcase update',
      )
      throw new ForbiddenError(
        `The showcase is being updated for tenant ${showcase.tenantId}, but the signed in tenant is ${tenantId}.`,
      )
    }

    try {
      const updatedShowcase = await this.showcaseRepository.update(id, showcase)
      this.logger.info({ showcaseId: id, slug: updatedShowcase.slug, tenantId }, 'Successfully updated showcase')
      return updatedShowcase
    } catch (error) {
      this.logger.error({ error, showcaseId: id, tenantId }, 'Failed to update showcase')
      throw error
    }
  }

  public deleteShowcase = async (id: string): Promise<void> => {
    const tenantId = this.getTenantId()
    this.logger.info({ showcaseId: id, tenantId }, 'Deleting showcase')

    try {
      const existingShowcase = await this.showcaseRepository.findById(id)
      if (existingShowcase) {
        if (existingShowcase.tenantId !== tenantId) {
          this.logger.warn(
            { showcaseId: id, showcaseTenantId: existingShowcase.tenantId, sessionTenantId: tenantId },
            'Tenant ID mismatch in showcase deletion',
          )
          return Promise.reject(
            new ForbiddenError(
              `The showcase is being deleted for tenant ${existingShowcase.tenantId}, but the signed in tenant is ${tenantId}.`,
            ),
          )
        }
        await this.showcaseRepository.delete(id)
        this.logger.info({ showcaseId: id, tenantId }, 'Successfully deleted showcase')
      } else {
        this.logger.info({ showcaseId: id, tenantId }, 'Showcase not found for deletion')
        return
      }
    } catch (error) {
      this.logger.error({ error, showcaseId: id, tenantId }, 'Failed to delete showcase')
      throw error
    }
  }

  public getIdBySlug = async (slug: string): Promise<string> => {
    const tenantId = this.getTenantId()
    this.logger.info({ slug, tenantId }, 'Finding showcase ID by slug')
    try {
      const id = await this.showcaseRepository.findIdBySlug(slug, tenantId)
      this.logger.info({ slug, showcaseId: id, tenantId }, 'Successfully found showcase ID by slug')
      return id
    } catch (error) {
      this.logger.error({ error, slug, tenantId }, 'Failed to find showcase ID by slug')
      throw error
    }
  }

  /**
   * Approves a specific showcase by its ID.
   * @param id The ID of the showcase to approve.
   * @returns The updated Showcase object.
   * @throws NotFoundError if the showcase doesn't exist.
   * @throws Error if the current user cannot be determined (implementation specific).
   */
  public approveShowcase = async (id: string): Promise<Showcase> => {
    this.logger.info({ showcaseId: id }, 'Approving showcase')

    try {
      const currentUser = await this.sessionService.getCurrentUser()
      if (!currentUser) {
        this.logger.error({ showcaseId: id }, 'Could not determine the approving user')
        return Promise.reject(new Error('Could not determine the approving user.'))
      }

      const tenantId = this.getTenantId()
      this.logger.info({ showcaseId: id, userId: currentUser.id, tenantId }, 'Approving showcase with user context')

      const approvedShowcase = await this.showcaseRepository.approve(id, tenantId, currentUser.id)
      this.logger.info({ showcaseId: id, userId: currentUser.id, tenantId }, 'Successfully approved showcase')
      return approvedShowcase
    } catch (error) {
      this.logger.error({ error, showcaseId: id }, 'Failed to approve showcase')
      throw error
    }
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
    const urlTenantId = this.sessionService.getUrlTenantId()
    if (!urlTenantId) {
      throw new InternalServerError('Tenant details are missing')
    }
    return urlTenantId
  }
}

export default ShowcaseService
