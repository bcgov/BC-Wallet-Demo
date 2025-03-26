import { createAsyncThunk } from '@reduxjs/toolkit'

import * as Api from '../../api/ShowcaseApi'
import type { IssuanceScenario, ShowcaseScenariosInner, Step } from 'bc-wallet-openapi'
import { ScenarioType } from 'bc-wallet-openapi'
import type { Showcase } from '../types'

export const fetchShowcaseBySlug = createAsyncThunk(
    'showcases/fetchById',
    async (slug: string): Promise<Showcase | null> => {
      try {
        const response = await Api.getShowcaseBySlug(slug)

        if (!response.data.showcase) {
          return Promise.reject(Error('No showcase found in response'))
        }

        const scenarios = response.data.showcase.scenarios.map((scenario: ShowcaseScenariosInner) => {
          if (scenario.personas === undefined || scenario.personas?.length === 0) {
            throw new Error('No personas found in scenario')
          }

          if (scenario.steps === undefined || scenario.steps?.length === 0) {
            throw new Error('No steps found in scenario')
          }

          const steps = scenario.steps.map((step: Step) => {
            const actions = step.actions.map((action) => ({
              actionType: action.actionType,
            }))

            return {
              title: step.title,
              description: step.description,
              order: step.order,
              ...(step.asset && { asset: step.asset.id }),
              actions,
            }
          })

          return {
            persona: {
              id: scenario.personas[0].id,
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
