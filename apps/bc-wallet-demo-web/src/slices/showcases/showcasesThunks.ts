import { createAsyncThunk } from '@reduxjs/toolkit'
import { getShowcaseBySlug } from '../../api/ShowcaseApi';
import { getCredentialDefinitionById } from '../../api/credentialDefinitionApi'
import {PresentationScenario, ScenarioType, ShareCredentialAction, StepActionType} from 'bc-wallet-openapi'
import { RootState } from '../../store/configureStore'
import type { AcceptCredentialAction, CredentialAttribute, IssuanceScenario, ShowcaseScenariosInner, Step } from 'bc-wallet-openapi'
import type {Persona, Scenario, Showcase, StepAction} from '../types'

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
            // const actionPromises = step?.actions?.map(async (action) => {
            //   const credentialDefinition = (action.actionType === StepActionType.AcceptCredential || action.actionType === StepActionType.ShareCredential) ? (await getCredentialDefinitionById((<AcceptCredentialAction | ShareCredentialAction>action).credentialDefinitionId)).data.credentialDefinition : undefined
            //
            //   if (credentialDefinition && !credentialDefinition.identifier) {
            //     throw new Error('No identifier found in credential definition')
            //   }
            //
            //   return {
            //     actionType: action.actionType,
            //     ...(credentialDefinition && { credentialDefinitions: [
            //       {
            //         id: credentialDefinition.id,
            //         name: credentialDefinition.name,
            //         version: credentialDefinition.version,
            //         icon: credentialDefinition.icon?.id,
            //         attributes: credentialDefinition.credentialSchema.attributes?.map((attribute: CredentialAttribute) => ({
            //           name: attribute.name,
            //           value: attribute.value
            //         })) ?? [],
            //         identifier: credentialDefinition.identifier!
            //       }
            //     ] })
            //   }
            // }) ?? []
            // const actions = await Promise.all(actionPromises)
            let actions: StepAction[] = []
            if (index === 3) {
              actions = [
                {
                  actionType: StepActionType.ChooseWallet
                }
              ]
            } else if (index === 4) {
              actions = [
                {
                  actionType: StepActionType.SetupConnection
                }
              ]
            } else if (index === 5) {
              actions = [
                {
                  actionType: StepActionType.AcceptCredential,
                  credentialDefinitions: [
                    {
                      id: 'a987afd9-ed4d-4f73-a585-bf89cfe68f12',
                      name: 'default',//'student_card',
                      version: '1.0',
                      icon: 'b16d46c1-16fa-4a9e-a0b3-8e863eeb8fe1',
                      attributes: [
                        {
                          name: 'scores',
                          value: 'Alice',
                        }
                      ],
                      identifier: 'DpmUAZoZyADXmed1NMrJPZ:3:CL:2751642:default'
                    }
                  ]
                }
              ]
            }

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
                logo: (<IssuanceScenario>scenario).issuer.logo?.id,
              },
            }),
            ...(scenario.type === ScenarioType.Presentation && {
              relyingParty: {
                name: (<PresentationScenario>scenario).relyingParty.name,
                logo: (<PresentationScenario>scenario).relyingParty.logo?.id,
              },
            }),
            steps,
          }
        })

        const scenarios = await Promise.all(scenarioPromises)

        scenarios.push(
            {
              id: '09d29808-7856-4e70-86cf-12bf8074399f',
              slug: 'cool-clothes-online',
              name: 'Cool Clothes Online',
              type: ScenarioType.Presentation,
              persona: scenarios[0].persona,
              steps: [
                {
                  title: 'Start proving you`re a student',
                  description: 'Imagine, as Ana, you are in the checkout process for Bad Clothes Retail. They`re offering you a 15% discount on your purchase if you can prove you`re a student. First, scan the QR code.',
                  order: 1,
                  actions: [
                    {
                      actionType: StepActionType.ShareCredential,
                      credentialDefinitions: [
                        {
                          id: 'a987afd9-ed4d-4f73-a585-bf89cfe68f12',
                          name: 'credential 1',//'student_card',
                          version: '1.0',
                          icon: 'b16d46c1-16fa-4a9e-a0b3-8e863eeb8fe1',
                          attributes: [
                            {
                              name: 'scores',
                              value: 'Alice',
                            }
                          ],
                          identifier: 'DpmUAZoZyADXmed1NMrJPZ:3:CL:2751642:default'
                        }
                      ]
                    }
                  ]
                },
                {
                  title: 'Confirm the information to send',
                  description: 'also no one cares',
                  order: 2,
                  actions: [
                    {
                      actionType: StepActionType.ShareCredential,
                      credentialDefinitions: [
                        {
                          id: 'a987afd9-ed4d-4f73-a585-bf89cfe68f12',
                          name: 'credential 2',//'student_card',
                          version: '1.0',
                          icon: 'b16d46c1-16fa-4a9e-a0b3-8e863eeb8fe1',
                          attributes: [
                            {
                              name: 'scores',
                              value: 'Alice',
                            }
                          ],
                          identifier: 'DpmUAZoZyADXmed1NMrJPZ:3:CL:2751642:default'
                        }
                      ]
                    }
                  ]
                },
                {
                  title: 'You`re done!',
                  description: 'also no one cares',
                  order: 3,
                  actions: []
                },
              ],
              relyingParty: {
                name: 'Bram ten Cate',
                logo: 'b16d46c1-16fa-4a9e-a0b3-8e863eeb8fe1'
              },
            },
            {
              id: '06524f20-7521-4ecf-b894-065056bdd0e2',
              slug: 'bestbc-college',
              name: 'BestBC College',
              type: ScenarioType.Presentation,
              persona: scenarios[0].persona!,
              steps: [
                {
                  title: 'Start proving you`re a student',
                  description: 'also no one cares',
                  order: 1,
                  actions: [
                    {
                      actionType: StepActionType.ShareCredential,
                      credentialDefinitions: [
                        {
                          id: 'a987afd9-ed4d-4f73-a585-bf89cfe68f12',
                          name: 'credential 3',//'student_card',
                          version: '1.0',
                          icon: 'b16d46c1-16fa-4a9e-a0b3-8e863eeb8fe1',
                          attributes: [
                            {
                              name: 'scores',
                              value: 'Alice',
                            }
                          ],
                          identifier: 'DpmUAZoZyADXmed1NMrJPZ:3:CL:2751642:default'
                        }
                      ]
                    }
                  ]
                }
              ],
              relyingParty: {
                name: 'Bram ten Cate',
                logo: 'b16d46c1-16fa-4a9e-a0b3-8e863eeb8fe1'
              },
            },
            {
              id: 'ade053b6-2493-4875-a121-90e798a58a2f',
              slug: 'bad-clothes-retail',
              name: 'Bad Clothes Retail',
              type: ScenarioType.Presentation,
              persona: scenarios[1].persona,
              steps: [
                {
                  title: 'Start proving you`re a student',
                  description: 'Imagine, as John, you are in the checkout process for Bad Clothes Retail. They`re offering you a 15% discount on your purchase if you can prove you`re a student. First, scan the QR code.',
                  order: 1,
                  asset: '3a158677-b110-4a57-ab15-b048eb0f5069',
                  actions: [
                    {
                      actionType: StepActionType.ShareCredential,
                      credentialDefinitions: [
                        {
                          id: 'a987afd9-ed4d-4f73-a585-bf89cfe68f12',
                          name: 'credential 4',//'student_card',
                          version: '1.0',
                          icon: 'b16d46c1-16fa-4a9e-a0b3-8e863eeb8fe1',
                          attributes: [
                            {
                              name: 'scores',
                              value: 'Alice',
                            }
                          ],
                          identifier: 'DpmUAZoZyADXmed1NMrJPZ:3:CL:2751642:default'
                        }
                      ]
                    }
                  ]
                },
                {
                  title: 'Confirm the information to send',
                  description: 'also no one cares',
                  order: 2,
                  actions: [
                    {
                      actionType: StepActionType.ShareCredential,
                      credentialDefinitions: [
                        {
                          id: 'a987afd9-ed4d-4f73-a585-bf89cfe68f12',
                          name: 'credential 5',//'student_card',
                          version: '1.0',
                          icon: 'b16d46c1-16fa-4a9e-a0b3-8e863eeb8fe1',
                          attributes: [
                            {
                              name: 'scores',
                              value: 'Alice',
                            }
                          ],
                          identifier: 'DpmUAZoZyADXmed1NMrJPZ:3:CL:2751642:default'
                        }
                      ]
                    }
                  ]
                },
                {
                  title: 'You`re done!',
                  description: 'also no one cares',
                  order: 3,
                  actions: []
                },
              ],
              relyingParty: {
                name: 'Bram ten Cate',
                logo: 'b16d46c1-16fa-4a9e-a0b3-8e863eeb8fe1'
              },
            },
            {
              id: '67c8f0ff-c798-4164-afc8-dd6b81630bfc',
              slug: 'worstbc-college',
              name: 'WorstBC College',
              type: ScenarioType.Presentation,
              persona: scenarios[1].persona!,
              steps: [
                {
                  title: 'Start proving you`re a student',
                  description: 'also no one cares',
                  order: 1,
                  actions: [
                    {
                      actionType: StepActionType.ShareCredential,
                      credentialDefinitions: [
                        {
                          id: 'a987afd9-ed4d-4f73-a585-bf89cfe68f12',
                          name: 'credential 6',//'student_card',
                          version: '1.0',
                          icon: 'b16d46c1-16fa-4a9e-a0b3-8e863eeb8fe1',
                          attributes: [
                            {
                              name: 'scores',
                              value: 'Alice',
                            }
                          ],
                          identifier: 'DpmUAZoZyADXmed1NMrJPZ:3:CL:2751642:default'
                        }
                      ]
                    }
                  ]
                }
              ],
              relyingParty: {
                name: 'Bram ten Cate',
                logo: 'b16d46c1-16fa-4a9e-a0b3-8e863eeb8fe1'
              },
            }
        )

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

export const fetchScenarioBySlug = createAsyncThunk(
    'showcases/fetchScenarioBySlug',
    async (scenarioSlug: string, thunkAPI): Promise<Scenario | null> => {
      const state = thunkAPI.getState() as RootState;
      const showcase = state.showcases.showcase;

      if (!showcase) {
        return null;
      }

      return showcase.scenarios.find((scenario) => scenario.slug === scenarioSlug) || null
    })
