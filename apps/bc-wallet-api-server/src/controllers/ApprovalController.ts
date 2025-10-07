import {
  CredentialDefinitionResponse,
  CredentialDefinitionResponseFromJSONTyped,
  PendingApprovalsResponse,
  PendingApprovalsResponseFromJSONTyped,
  ShowcaseResponse,
  ShowcaseResponseFromJSONTyped,
} from 'bc-wallet-openapi'
import { Authorized, Get, JsonController, NotFoundError, Param, Post } from 'routing-controllers'
import { Service } from 'typedi'

import CredentialDefinitionService from '../services/CredentialDefinitionService'
import ShowcaseService from '../services/ShowcaseService'
import { getBasePath } from '../utils/auth'
import { createRequestLogger } from '../utils/logger'
import { credentialDefinitionDTOFrom, showcaseDTOFrom } from '../utils/mappers'

@JsonController(getBasePath())
@Service()
export class ApprovalController {
  private readonly logger = createRequestLogger('ApprovalController')

  public constructor(
    private showcaseService: ShowcaseService,
    private credentialDefinitionService: CredentialDefinitionService,
  ) {}

  @Authorized()
  @Post('/credentials/definitions/:definitionId/approve')
  public async approveCredentialDefinition(
    @Param('definitionId') definitionId: string,
  ): Promise<CredentialDefinitionResponse> {
    this.logger.info({ definitionId }, 'Starting credential definition approval')

    try {
      const updatedDefinition = await this.credentialDefinitionService.approveCredentialDefinition(definitionId)
      if (!updatedDefinition) {
        this.logger.warn({ definitionId }, 'Credential definition not found for approval')
        return Promise.reject(new NotFoundError(`Credential Definition with ID ${definitionId} not found`))
      }

      this.logger.info({ definitionId }, 'Credential definition approved successfully')
      return CredentialDefinitionResponseFromJSONTyped(
        { credentialDefinition: credentialDefinitionDTOFrom(updatedDefinition) },
        false,
      )
    } catch (error) {
      this.logger.error({ error, definitionId }, 'Failed to approve credential definition')
      return Promise.reject(error)
    }
  }

  @Authorized()
  @Post('/showcases/:slug/approve')
  public async approveShowcase(@Param('slug') slug: string): Promise<ShowcaseResponse> {
    this.logger.info({ slug }, 'Starting showcase approval')

    try {
      const updatedShowcase = await this.showcaseService.approveShowcaseBySlug(slug)
      if (!updatedShowcase) {
        this.logger.warn({ slug }, 'Showcase not found for approval')
        return Promise.reject(new NotFoundError(`Showcase with slug ${slug} not found`))
      }

      this.logger.info({ slug }, 'Showcase approved successfully')
      return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(updatedShowcase) }, false)
    } catch (error) {
      this.logger.error({ error, slug }, 'Failed to approve showcase')
      return Promise.reject(error)
    }
  }

  @Authorized()
  @Get('/approvals/pending')
  public async getPendingApprovals(): Promise<PendingApprovalsResponse> {
    this.logger.info('Fetching pending approvals')

    try {
      const [pendingShowcases, pendingDefinitions] = await Promise.all([
        this.showcaseService.getUnapproved(),
        this.credentialDefinitionService.getUnapproved(),
      ])

      const showcases = pendingShowcases.map(showcaseDTOFrom)
      const credentialDefinitions = pendingDefinitions.map(credentialDefinitionDTOFrom)

      this.logger.info(
        {
          showcasesCount: showcases.length,
          credentialDefinitionsCount: credentialDefinitions.length,
        },
        'Fetched pending approvals successfully',
      )

      return PendingApprovalsResponseFromJSONTyped({ showcases, credentialDefinitions }, false)
    } catch (error) {
      this.logger.error({ error }, 'Failed to fetch pending approvals')
      return Promise.reject(error)
    }
  }
}

export default ApprovalController
