import { Get, JsonController, Param, Post } from 'routing-controllers'
import { Service } from 'typedi'
import {
  CredentialDefinitionResponse,
  CredentialDefinitionResponseFromJSONTyped,
  PendingApprovalsResponse,
  PendingApprovalsResponseFromJSONTyped,
} from 'bc-wallet-openapi'
import CredentialDefinitionService from '../services/CredentialDefinitionService'
import { credentialDefinitionDTOFrom } from '../utils/mappers'
import { NotFoundError } from '../errors'

@JsonController()
@Service()
export class ApprovalController {
  constructor(
    // private showcaseService: ShowcaseService,
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

  @Get('/approvals/pending')
  public async getPendingApprovals(): Promise<PendingApprovalsResponse> {
    try {
      /*
      const [pendingShowcases, pendingDefinitions] = await Promise.all([
        this.showcaseService.getUnapproved(),
        this.credentialDefinitionService.getUnapproved(),
      ])
*/
      const pendingDefinitions = await this.credentialDefinitionService.getUnapproved()

      //const showcases = pendingShowcases.map(showcaseDTOFrom)
      const credentialDefinitions = pendingDefinitions.map(credentialDefinitionDTOFrom)

      return PendingApprovalsResponseFromJSONTyped({ /*showcases,*/ credentialDefinitions }, false)
    } catch (e) {
      console.error('Get pending approvals failed:', e)
      return Promise.reject(e)
    }
  }
}