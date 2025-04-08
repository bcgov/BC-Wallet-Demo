import { Get, JsonController, Param, Post } from 'routing-controllers'
import { Service } from 'typedi'
import {
  CredentialDefinitionResponse,
  CredentialDefinitionResponseFromJSONTyped,
  PendingApprovalsResponse,
  PendingApprovalsResponseFromJSONTyped,
  ShowcaseResponse,
  ShowcaseResponseFromJSONTyped,
} from 'bc-wallet-openapi'
import CredentialDefinitionService from '../services/CredentialDefinitionService'
import { credentialDefinitionDTOFrom, showcaseDTOFrom } from '../utils/mappers'
import { NotFoundError } from '../errors'
import ShowcaseService from '../services/ShowcaseService'

@JsonController()
@Service()
export class ApprovalController {
  constructor(
    private showcaseService: ShowcaseService,
    private credentialDefinitionService: CredentialDefinitionService,
  ) {}

  @Post('/credentials/definitions/:definitionId/approve')
  public async approveCredentialDefinition(
    @Param('definitionId') definitionId: string,
  ): Promise<CredentialDefinitionResponse> {
    try {
      const updatedDefinition = await this.credentialDefinitionService.approveCredentialDefinition(definitionId)
      if (!updatedDefinition) {
        return Promise.reject(new NotFoundError(`Credential Definition with ID ${definitionId} not found`))
      }
      return CredentialDefinitionResponseFromJSONTyped(
        { credentialDefinition: credentialDefinitionDTOFrom(updatedDefinition) },
        false,
      )
    } catch (e) {
      console.error(`Approve credential definition id=${definitionId} failed:`, e)
      return Promise.reject(e)
    }
  }

  @Post('/showcases/:slug/approve')
  public async approveShowcase(@Param('slug') slug: string): Promise<ShowcaseResponse> {
    try {
      const updatedShowcase = await this.showcaseService.approveShowcaseBySlug(slug)
      if (!updatedShowcase) {
        return Promise.reject(new NotFoundError(`Showcase with slug ${slug} not found`))
      }
      return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(updatedShowcase) }, false)
    } catch (e) {
      console.error(`Approve showcase slug=${slug} failed:`, e)
      return Promise.reject(e)
    }
  }

  @Get('/approvals/pending')
  public async getPendingApprovals(): Promise<PendingApprovalsResponse> {
    try {
      const [pendingShowcases, pendingDefinitions] = await Promise.all([
        this.showcaseService.getUnapproved(),
        this.credentialDefinitionService.getUnapproved(),
      ])

      const showcases = pendingShowcases.map(showcaseDTOFrom)
      const credentialDefinitions = pendingDefinitions.map(credentialDefinitionDTOFrom)

      return PendingApprovalsResponseFromJSONTyped({ showcases, credentialDefinitions }, false)
    } catch (e) {
      console.error('Get pending approvals failed:', e)
      return Promise.reject(e)
    }
  }
}

export default ApprovalController