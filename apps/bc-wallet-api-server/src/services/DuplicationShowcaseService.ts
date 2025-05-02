import { Inject, Service } from 'typedi'

import PersonaRepository from '../database/repositories/PersonaRepository'
import ScenarioRepository from '../database/repositories/ScenarioRepository'
import ShowcaseRepository from '../database/repositories/ShowcaseRepository'
import { IssuanceScenario, NewShowcase, PresentationScenario, Scenario, ScenarioType, Showcase, ShowcaseStatus, StepActionTypes } from '../types'
import { ISessionService } from '../types/services/session'

/**
 * Extracts just the ID from an object or returns the ID if it's already a string
 * @param obj Object or string ID
 * @returns String ID
 */
const extractId = (obj: any): string => {
  if (typeof obj === 'string') return obj
  if (obj && typeof obj === 'object' && 'id' in obj) return obj.id
  return ''
}

/**
 * Removes specified fields from an object and returns a new object
 * @param obj The source object
 * @param fieldsToRemove Array of field names to remove
 * @returns A new object without the specified fields
 */
const removeFields = <T extends Record<string, unknown>>(obj: T, fieldsToRemove: string[]): Partial<T> => {
  const newObj: Partial<T> = {}

  for (const key in obj) {
    if (!fieldsToRemove.includes(key)) {
      newObj[key] = obj[key]
    }
  }

  return newObj
}

@Service()
class DuplicationShowcaseService {
  public constructor(
    private readonly showcaseRepository: ShowcaseRepository,
    private readonly personaRepository: PersonaRepository,
    private readonly scenarioRepository: ScenarioRepository,
    @Inject('ISessionService') private readonly sessionService: ISessionService,
  ) {}

  public duplicateShowcase = async (id: string, tenantId: string): Promise<Showcase> => {
    const showcase = await this.showcaseRepository.findById(id)
    const newPersonaIds: string[] = []
    const newScenarioIds: string[] = []
    const personaIdMap: Record<string, string> = {}

    const currentUser = await this.sessionService.getCurrentUser()
    if (!currentUser) {
      throw new Error('Could not determine current logged in user.')
    }

    if (showcase.personas && showcase.personas.length > 0) {
      for (const personaObj of showcase.personas) {
        const persona = personaObj

        const personaRequest = {
          name: persona.name,
          role: persona.role,
          description: persona.description,
          headshotImage: extractId(persona.headshotImage),
          bodyImage: extractId(persona.bodyImage),
          hidden: persona.hidden,
        }

        const newPersona = await this.personaRepository.create(personaRequest)
        personaIdMap[persona.id] = newPersona.id
        newPersonaIds.push(newPersona.id)
      }
    }

    if (showcase.scenarios && showcase.scenarios.length > 0) {
      for (const scenarioObj of showcase.scenarios) {
        const cleanedSteps = scenarioObj.steps.map((step) => {
          const cleanedStep = removeFields(step, ['id', 'createdAt', 'updatedAt'])

          if (cleanedStep.actions && Array.isArray(cleanedStep.actions)) {
            cleanedStep.actions = cleanedStep.actions.map((action) => {
              const cleanedAction = removeFields(action, ['id', 'createdAt', 'updatedAt'])

              // if (cleanedAction.proofRequest) {
              //   cleanedAction.proofRequest = removeFields(cleanedAction.proofRequest, ['id', 'createdAt', 'updatedAt'])
              // }

              return cleanedAction as StepActionTypes
            })
          }

          return cleanedStep
        })

        const mappedPersonaIds = scenarioObj.personas.map((p) => personaIdMap[extractId(p)] || extractId(p))

        const scenarioType = scenarioObj.scenarioType

        const baseScenarioData = {
          name: scenarioObj.name,
          description: scenarioObj.description,
          scenarioType,
          steps: cleanedSteps,
          hidden: scenarioObj.hidden,
          personas: mappedPersonaIds,
        }

        let newScenario: IssuanceScenario | PresentationScenario | null = null

        if (scenarioType === ScenarioType.ISSUANCE) {
          newScenario = await this.scenarioRepository.create({
            ...baseScenarioData,
            // @ts-expect-error: TODO SHOWCASE-81
            issuer: scenarioObj.issuer ? extractId(scenarioObj.issuer) : null,
            // @ts-expect-error: TODO SHOWCASE-81
            relyingParty: null,
          })
        } else if (scenarioType === ScenarioType.PRESENTATION) {
          newScenario = await this.scenarioRepository.create({
            ...baseScenarioData,
            issuer: null,
            // @ts-expect-error: TODO SHOWCASE-81
            relyingParty: scenarioObj.relyingParty ? extractId(scenarioObj.relyingParty) : null,
          })
        }

        if (newScenario) {
          newScenarioIds.push(newScenario.id)
        }
      }
    }

    const newShowcase: NewShowcase = {
      name: `${showcase.name} (Copy)`,
      description: showcase.description,
      status: ShowcaseStatus.ACTIVE,
      createdBy: currentUser.id,
      bannerImage: showcase.bannerImage ? extractId(showcase.bannerImage) : undefined,
      scenarios: newScenarioIds,
      personas: newPersonaIds,
      tenantId: tenantId,
      hidden: showcase.hidden,
      completionMessage: showcase.completionMessage,
    }

    return this.showcaseRepository.create(newShowcase)
  }
}

export default DuplicationShowcaseService
