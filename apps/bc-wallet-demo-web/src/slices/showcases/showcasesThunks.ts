import { createAsyncThunk } from '@reduxjs/toolkit'
import { getShowcaseBySlug } from '../../api/ShowcaseApi';
import { getCredentialDefinitionById } from '../../api/credentialDefinitionApi'
import {ScenarioType, ShareCredentialAction, StepActionType} from 'bc-wallet-openapi'
import { RootState } from '../../store/configureStore'
import type { AcceptCredentialAction, CredentialAttribute, IssuanceScenario, ShowcaseScenariosInner, Step } from 'bc-wallet-openapi'
import type { Persona, Showcase } from '../types'

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
            const actionPromises = step?.actions?.map(async (action) => {
              const credentialDefinition = (action.actionType === StepActionType.AcceptCredential || action.actionType === StepActionType.ShareCredential) ? (await getCredentialDefinitionById((<AcceptCredentialAction | ShareCredentialAction>action).credentialDefinitionId)).data.credentialDefinition : undefined

              if (credentialDefinition && !credentialDefinition.identifier) {
                throw new Error('No identifier found in credential definition')
              }

              return {
                actionType: action.actionType,
                ...(credentialDefinition && { credentialDefinitions: [
                  {
                    id: credentialDefinition.id,
                    name: credentialDefinition.name,
                    version: credentialDefinition.version,
                    icon: credentialDefinition.icon?.id,
                    attributes: credentialDefinition.credentialSchema.attributes?.map((attribute: CredentialAttribute) => ({
                      name: attribute.name,
                      value: attribute.value
                    })) ?? [],
                    identifier: credentialDefinition.identifier!
                  }
                ] })
              }
            }) ?? []
            const actions = await Promise.all(actionPromises)

            return {
              title: step.title,
              description: step.description,
              order: step.order,
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
                name: (<IssuanceScenario>scenario).issuer.name,
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
          scenarios,
        }
      } catch (e) {
        return null
      }
    }
)

export const fetchPersonaBySlug = createAsyncThunk(
    'showcases/fetchPersonaBySlug',
    async (personaSlug: string, thunkAPI): Promise<Persona | null> => {
      const state = thunkAPI.getState() as RootState;
      const showcase = state.showcases.showcase;

      if (!showcase) {
        return null;
      }

      return showcase.scenarios
          .map((scenario) => scenario.persona)
          .find((persona) => persona.slug === personaSlug) || null
    })
