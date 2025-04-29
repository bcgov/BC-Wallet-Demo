import { createAsyncThunk } from '@reduxjs/toolkit'
import { ScenarioType, StepActionType } from 'bc-wallet-openapi'
import type {
  AcceptCredentialAction,
  CredentialAttribute,
  IssuanceScenario as IssuanceScenarioDTO,
  ShowcaseScenariosInner,
  Step,
  AriesOOBAction,
  PresentationScenario as PresentationScenarioDTO,
} from 'bc-wallet-openapi'

import { getCredentialDefinitionById } from '../../api/credentialDefinitionApi'
import { getShowcaseBySlug } from '../../api/ShowcaseApi'
import { RootState } from '../../store/configureStore'
import type { Persona, Scenario, Showcase, IssuanceScenario, PresentationScenario } from '../types'

export const fetchShowcaseBySlug = createAsyncThunk(
  'showcases/fetchBySlug',
  async (slug: string): Promise<Showcase | null> => {
    try {
      const response = await getShowcaseBySlug(slug)

      if (!response.data.showcase) {
        return Promise.reject(Error('No showcase found in response'))
      }

      const scenarioPromises = response.data.showcase.scenarios.map(async (scenario: ShowcaseScenariosInner) => {
        if (scenario.personas === undefined || scenario.personas?.length === 0) {
          throw new Error('No personas found in scenario')
        }

        if (scenario.steps === undefined || scenario.steps?.length === 0) {
          throw new Error('No steps found in scenario')
        }

        const stepPromises = scenario.steps.map(async (step: Step, index) => {
          const actionPromises =
            step?.actions?.map(async (action) => {
              const credentialDefinition =
                action.actionType === StepActionType.AcceptCredential || action.actionType === StepActionType.AriesOob
                  ? (
                      await getCredentialDefinitionById(
                        (<AcceptCredentialAction | AriesOOBAction>action).credentialDefinitionId,
                      )
                    ).data.credentialDefinition
                  : undefined

              // if (credentialDefinition && !credentialDefinition.identifier) {
              //   throw new Error('No identifier found in credential definition. (Not registered in Traction?')
              // }

              return {
                actionType: action.actionType,
                title: action.title,
                text: action.text,
                ...(credentialDefinition && {
                  credentialDefinitions: [
                    {
                      id: credentialDefinition.id,
                      name: credentialDefinition.name,
                      version: credentialDefinition.version,
                      icon: credentialDefinition.icon?.id,
                      schema: {
                        name: credentialDefinition.credentialSchema.name,
                        identifier: credentialDefinition.credentialSchema.identifier,
                        attributes:
                          credentialDefinition.credentialSchema.attributes?.map((attribute: CredentialAttribute) => ({
                            name: attribute.name,
                            value: attribute.value,
                          })) ?? [],
                      },
                      ...(action.actionType === StepActionType.AriesOob && {
                        proofRequest: (<AriesOOBAction>action).proofRequest,
                      }),
                      identifier: credentialDefinition.identifier,
                    },
                  ],
                }),
              }
            }) ?? []
          const actions = await Promise.all(actionPromises)

          return {
            title: step.title,
            description: step.description,
            order: step.order + 1,
            ...(step.asset && { asset: step.asset.id }),
            actions,
          }
        })

        const steps = await Promise.all(stepPromises)

        return {
          id: scenario.id,
          slug: scenario.slug,
          name: scenario.name,
          type: scenario.type,
          persona: {
            id: scenario.personas[0].id,
            slug: scenario.personas[0].slug,
            name: scenario.personas[0].name ?? 'UNKNOWN',
            role: scenario.personas[0].role ?? 'UNKNOWN',
            ...(scenario.personas[0].headshotImage && { headshotImage: scenario.personas[0].headshotImage?.id }),
            ...(scenario.personas[0].bodyImage && { bodyImage: scenario.personas[0].bodyImage?.id }),
          },
          ...(scenario.type === ScenarioType.Issuance && {
            issuer: {
              name: (<IssuanceScenarioDTO>scenario).issuer?.name,
              logo: (<IssuanceScenarioDTO>scenario).issuer?.logo?.id,
            },
          }),
          ...(scenario.type === ScenarioType.Presentation && {
            relyingParty: {
              name: (<PresentationScenarioDTO>scenario).relyingParty.name,
              logo: (<PresentationScenarioDTO>scenario).relyingParty.logo?.id,
            },
          }),
          steps,
        }
      })

      const scenarios = await Promise.all(scenarioPromises)

      return {
        id: response.data.showcase.id,
        name: response.data.showcase.name,
        slug: response.data.showcase.slug,
        description: response.data.showcase.description,
        scenarios: scenarios as Array<PresentationScenario | IssuanceScenario>,
      }
    } catch (e) {
      console.error(e)
      return null
    }
  },
)

export const fetchPersonaBySlug = createAsyncThunk(
  'showcases/fetchPersonaBySlug',
  async (personaSlug: string, thunkAPI): Promise<Persona | null> => {
    const state = thunkAPI.getState() as RootState
    const showcase = state.showcases.showcase

    if (!showcase) {
      return null
    }

    return (
      showcase.scenarios.map((scenario) => scenario.persona).find((persona) => persona.slug === personaSlug) || null
    )
  },
)

export const fetchScenarioBySlug = createAsyncThunk(
  'showcases/fetchScenarioBySlug',
  async (scenarioSlug: string, thunkAPI): Promise<Scenario | null> => {
    const state = thunkAPI.getState() as RootState
    const showcase = state.showcases.showcase

    if (!showcase) {
      return null
    }

    return showcase.scenarios.find((scenario) => scenario.slug === scenarioSlug) || null
  },
)
