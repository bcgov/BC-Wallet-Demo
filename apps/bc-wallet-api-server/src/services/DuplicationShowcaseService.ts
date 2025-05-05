import { Inject, Service } from 'typedi'

import PersonaRepository from '../database/repositories/PersonaRepository'
import ScenarioRepository from '../database/repositories/ScenarioRepository'
import ShowcaseRepository from '../database/repositories/ShowcaseRepository'
import {
  IssuanceScenario,
  NewShowcase,
  NewStep,
  NewStepActionTypes,
  PresentationScenario,
  ScenarioType,
  Showcase,
  ShowcaseStatus,
} from '../types'
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
const removeFields = <T extends Record<string, any>>(obj: T, fieldsToRemove: string[]): Partial<T> => {
  const newObj: Partial<T> = {}

  for (const key in obj) {
    if (!fieldsToRemove.includes(key)) {
      newObj[key] = obj[key]
    }
  }

  return newObj
}

/**
 * Extracts the ID from an object or returns null if the object is null
 * @param obj The object to extract the ID from
 * @returns The ID of the object or null if the object is null
 */
const extractIdOrNull = (obj: any) => (obj ? extractId(obj) : null)

@Service()
@Service()
class DuplicationShowcaseService {
  public constructor(
    private readonly showcaseRepository: ShowcaseRepository,
    private readonly personaRepository: PersonaRepository,
    private readonly scenarioRepository: ScenarioRepository,
    @Inject('ISessionService') private readonly sessionService: ISessionService,
  ) {}

  public duplicateShowcase = async (id: string): Promise<Showcase> => {
    const showcase = await this.showcaseRepository.findById(id)
    const newPersonaIds: string[] = []
    const newScenarioIds: string[] = []
    const personaIdMap: Record<string, string> = {}

    const currentUserId = showcase.createdBy?.id
    const tenant = await this.sessionService.getCurrentTenant()
    
    if (!tenant) {
      throw new Error('Tenant not found')
    }

    // const currentUserId = await this.sessionService.getCurrentUser()
    // if (!currentUserId) {
    //   throw new Error('Could not determine current logged in user.')
    // }

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
          const cleanedStep = removeFields(step, ['id', 'createdAt', 'updatedAt']) as NewStep
          cleanedStep.asset = step.asset ? extractIdOrNull(step.asset) : null

          if (cleanedStep.actions && Array.isArray(cleanedStep.actions)) {
            cleanedStep.actions = cleanedStep.actions.map((action) => {
              const cleanedAction = removeFields(action, ['id', 'createdAt', 'updatedAt'])

              if ('proofRequest' in cleanedAction) {
                cleanedAction.proofRequest = {
                  attributes: {
                    ...cleanedAction.proofRequest?.attributes,
                  },
                  predicates: {
                    ...cleanedAction.proofRequest?.predicates,
                  },
                }
              }

              return cleanedAction as NewStepActionTypes
            })
          }

          return cleanedStep
        })

        const mappedPersonaIds = scenarioObj.personas.map((p) => personaIdMap[extractId(p)] || extractId(p))

        const scenarioType = scenarioObj.scenarioType

        const baseScenarioData = {
          name: scenarioObj.name,
          description: scenarioObj.description || '',
          scenarioType,
          steps: cleanedSteps,
          hidden: scenarioObj.hidden,
          personas: mappedPersonaIds,
        }

        let newScenario: IssuanceScenario | PresentationScenario | null = null

        if (scenarioType === ScenarioType.ISSUANCE) {
          if ('issuer' in scenarioObj && scenarioObj.issuer && 'id' in scenarioObj.issuer) {
            const payload = {
              ...baseScenarioData,
              issuer: scenarioObj.issuer.id,
            }
            newScenario = await this.scenarioRepository.create(payload)
          } else {
            throw new Error('Issuer not found in scenario')
          }
        } else if (scenarioType === ScenarioType.PRESENTATION) {
          if ('relyingParty' in scenarioObj && scenarioObj.relyingParty && 'id' in scenarioObj.relyingParty) {
            const payload = {
              ...baseScenarioData,
              relyingParty: scenarioObj.relyingParty.id,
            }
            newScenario = await this.scenarioRepository.create(payload)
          } else {
            throw new Error('Relying party not found in scenario')
          }
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
      createdBy: currentUserId,
      bannerImage: showcase.bannerImage ? extractId(showcase.bannerImage) : undefined,
      scenarios: newScenarioIds,
      personas: newPersonaIds,
      tenantId: tenant?.id!,
      hidden: showcase.hidden,
      completionMessage: showcase.completionMessage,
    }

    return this.showcaseRepository.create(newShowcase)
  }
}

export default DuplicationShowcaseService
