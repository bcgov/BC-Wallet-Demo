import { Get, JsonController, NotFoundError, Param } from 'routing-controllers'
import { Service } from 'typedi'

import { CredentialModel, LeanCredentialDoc } from '../db/models/Credential'
import { ShowcaseModel } from '../db/models/Showcase'
import { toCredentialResponse } from '../utils/credentialMapper'
import logger from '../utils/logger'

async function hydrateCredentials(showcase: any) {
  // Credentials are stored as IDs in the database
  // Hydrate them by fetching the full credential objects
  const credentialIds = showcase.credentials as string[]
  const introductionCredentialIds = showcase.introduction?.flatMap((step: any) => step.credentials || []) || []
  const allCredentialIds = [...new Set([...credentialIds, ...introductionCredentialIds])]

  if (!allCredentialIds?.length) {
    return { ...(showcase.toObject?.() || showcase), credentials: [] }
  }

  try {
    const credentials = await CredentialModel.find({ _id: { $in: allCredentialIds } }).lean<LeanCredentialDoc[]>()
    const credMap = new Map(credentials.map((c) => [String(c._id), c]))

    const mapCredentialIdToObject = (id: string) => {
      const cred = credMap.get(id)
      return cred ? toCredentialResponse(cred) : null
    }

    const hydratedCredentials = credentialIds.map(mapCredentialIdToObject).filter(Boolean)

    const hydratedIntroduction =
      showcase.introduction?.map((step: any) => ({
        ...step,
        credentials: (step.credentials || []).map(mapCredentialIdToObject).filter(Boolean),
      })) || []

    return {
      ...(showcase.toObject?.() || showcase),
      credentials: hydratedCredentials,
      introduction: hydratedIntroduction,
    }
  } catch (error) {
    logger.error(error, 'Error hydrating credentials')
    return { ...(showcase.toObject?.() || showcase), credentials: [] }
  }
}

@JsonController('/showcases')
@Service()
export class ShowcaseController {
  /**
   * Retrieve showcase by id
   */
  @Get('/:showcaseId')
  public async getShowcaseById(@Param('showcaseId') showcaseId: string) {
    logger.debug({ showcaseId }, 'Fetching showcase by id')
    const showcase = await ShowcaseModel.findOne({ name: showcaseId }).lean()

    if (!showcase) {
      logger.warn({ showcaseId }, 'Showcase not found')
      throw new NotFoundError(`showcase with showcaseId "${showcaseId}" not found.`)
    }

    logger.debug({ showcaseId }, 'Showcase found')
    return hydrateCredentials(showcase)
  }

  /**
   * Retrieve all showcases
   */
  @Get('/')
  public async getShowcases() {
    const showcases = await ShowcaseModel.find().lean()
    logger.debug({ count: showcases.length }, 'Fetching all showcases')
    return Promise.all(showcases.map(hydrateCredentials))
  }
}
