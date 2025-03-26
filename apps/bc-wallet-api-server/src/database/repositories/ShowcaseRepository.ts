import { inArray, eq } from 'drizzle-orm'
import { Service } from 'typedi'
import { BadRequestError } from 'routing-controllers'
import DatabaseService from '../../services/DatabaseService'
import CredentialDefinitionRepository from './CredentialDefinitionRepository'
import PersonaRepository from './PersonaRepository'
import ScenarioRepository from './ScenarioRepository'
import AssetRepository from './AssetRepository'
import { sortSteps } from '../../utils/sort'
import { generateSlug } from '../../utils/slug'
import { NotFoundError } from '../../errors'
import {
  credentialDefinitions,
  showcasesToCredentialDefinitions,
  showcases,
  scenarios,
  personas,
  showcasesToPersonas,
  showcasesToScenarios,
} from '../schema'
import { Showcase, NewShowcase, RepositoryDefinition } from '../../types'

@Service()
class ShowcaseRepository implements RepositoryDefinition<Showcase, NewShowcase> {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly personaRepository: PersonaRepository,
    private readonly credentialDefinitionRepository: CredentialDefinitionRepository,
    private readonly scenarioRepository: ScenarioRepository,
    private readonly assetRepository: AssetRepository,
  ) {}

  async create(showcase: NewShowcase): Promise<Showcase> {
    if (showcase.personas.length === 0) {
      return Promise.reject(new BadRequestError('At least one persona is required'))
    }
    if (showcase.credentialDefinitions.length === 0) {
      return Promise.reject(new BadRequestError('At least one credential definition is required'))
    }
    if (showcase.scenarios.length === 0) {
      return Promise.reject(new BadRequestError('At least one scenario is required'))
    }
    const bannerImageResult = showcase.bannerImage ? await this.assetRepository.findById(showcase.bannerImage) : null
    const personaPromises = showcase.personas.map(async (persona) => await this.personaRepository.findById(persona))
    await Promise.all(personaPromises)
    const credentialDefinitionPromises = showcase.credentialDefinitions.map(
      async (credentialDefinition) => await this.credentialDefinitionRepository.findById(credentialDefinition),
    )
    await Promise.all(credentialDefinitionPromises)
    const scenarioPromises = showcase.scenarios.map(async (scenario) => this.scenarioRepository.findById(scenario))
    await Promise.all(scenarioPromises)

    const connection = await this.databaseService.getConnection()
    const slug = await generateSlug({
      value: showcase.name,
      connection,
      schema: showcases,
    })

    return connection.transaction(async (tx): Promise<Showcase> => {
      const [showcaseResult] = await tx
        .insert(showcases)
        .values({
          ...showcase,
          slug,
        })
        .returning()

      const showcasesToScenariosResult = await tx
        .insert(showcasesToScenarios)
        .values(
          showcase.scenarios.map((scenarioId: string) => ({
            showcase: showcaseResult.id,
            scenario: scenarioId,
          })),
        )
        .returning()

      const scenariosResult = await tx.query.scenarios.findMany({
        where: inArray(
          scenarios.id,
          showcasesToScenariosResult.map((item) => item.scenario),
        ),
        with: {
          steps: {
            with: {
              actions: {
                with: {
                  proofRequest: true,
                },
              },
              asset: true,
            },
          },
          relyingParty: {
            with: {
              cds: {
                with: {
                  cd: {
                    with: {
                      icon: true,
                      cs: {
                        with: {
                          attributes: true,
                        },
                      },
                      representations: true,
                      revocation: true,
                    },
                  },
                },
              },
              logo: true,
            },
          },
          issuer: {
            with: {
              cds: {
                with: {
                  cd: {
                    with: {
                      icon: true,
                      cs: {
                        with: {
                          attributes: true,
                        },
                      },
                      representations: true,
                      revocation: true,
                    },
                  },
                },
              },
              css: {
                with: {
                  cs: {
                    with: {
                      attributes: true,
                    },
                  },
                },
              },
              logo: true,
            },
          },
          personas: {
            with: {
              persona: {
                with: {
                  headshotImage: true,
                  bodyImage: true,
                },
              },
            },
          },
          bannerImage: true,
        },
      })

      const showcasesToCredentialDefinitionsResult = await tx
        .insert(showcasesToCredentialDefinitions)
        .values(
          showcase.credentialDefinitions.map((credentialDefinitionId: string) => ({
            showcase: showcaseResult.id,
            credentialDefinition: credentialDefinitionId,
          })),
        )
        .returning()

      const credentialDefinitionsResult = await tx.query.credentialDefinitions.findMany({
        where: inArray(
          credentialDefinitions.id,
          showcasesToCredentialDefinitionsResult.map((item) => item.credentialDefinition),
        ),
        with: {
          cs: {
            with: {
              attributes: true,
            },
          },
          representations: true,
          revocation: true,
          icon: true,
        },
      })

      const showcasesToPersonasResult = await tx
        .insert(showcasesToPersonas)
        .values(
          showcase.personas.map((personaId: string) => ({
            showcase: showcaseResult.id,
            persona: personaId,
          })),
        )
        .returning()

      const personasResult = await tx.query.personas.findMany({
        where: inArray(
          personas.id,
          showcasesToPersonasResult.map((item) => item.persona),
        ),
        with: {
          headshotImage: true,
          bodyImage: true,
        },
      })

      return {
        ...showcaseResult,
        scenarios: scenariosResult.map((scenario) => ({
          ...scenario,
          steps: sortSteps(scenario.steps),
          relyingParty: scenario.relyingParty ? {
            id: scenario.relyingParty.id,
            name: scenario.relyingParty.name,
            type: scenario.relyingParty.type,
            description: scenario.relyingParty.description,
            organization: scenario.relyingParty.organization,
            logo: scenario.relyingParty.logo,
            credentialDefinitions: scenario.relyingParty!.cds.map((credentialDefinition: any) => credentialDefinition.cd),
            createdAt: scenario.relyingParty.createdAt,
            updatedAt: scenario.relyingParty.updatedAt,
          } : undefined,
          issuer: scenario.issuer ? {
            id: scenario.issuer.id,
            name: scenario.issuer.name,
            type: scenario.issuer.type,
            description: scenario.issuer.description,
            organization: scenario.issuer.organization,
            logo: scenario.issuer.logo,
            credentialDefinitions: scenario.issuer!.cds.map((credentialDefinition: any) => credentialDefinition.cd),
            credentialSchemas: scenario.issuer!.css.map((credentialSchema: any) => credentialSchema.cs),
            createdAt: scenario.issuer.createdAt,
            updatedAt: scenario.issuer.updatedAt,
          } : undefined,
          personas: scenario.personas.map((item: any) => item.persona),
        })),
        credentialDefinitions: credentialDefinitionsResult.map((item: any) => ({
          ...item,
          credentialSchema: item.cs,
        })),
        personas: personasResult,
        bannerImage: bannerImageResult,
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(showcases).where(eq(showcases.id, id))
  }

  async update(id: string, showcase: NewShowcase): Promise<Showcase> {
    await this.findById(id)
    if (showcase.personas.length === 0) {
      return Promise.reject(new BadRequestError('At least one persona is required'))
    }
    if (showcase.credentialDefinitions.length === 0) {
      return Promise.reject(new BadRequestError('At least one credential definition is required'))
    }
    if (showcase.scenarios.length === 0) {
      return Promise.reject(new BadRequestError('At least one scenario is required'))
    }

    const bannerImageResult = showcase.bannerImage ? await this.assetRepository.findById(showcase.bannerImage) : null

    const personaPromises = showcase.personas.map(async (persona) => await this.personaRepository.findById(persona))
    await Promise.all(personaPromises)
    const credentialDefinitionPromises = showcase.credentialDefinitions.map(
      async (credentialDefinition) => await this.credentialDefinitionRepository.findById(credentialDefinition),
    )
    await Promise.all(credentialDefinitionPromises)
    const scenarioPromises = showcase.scenarios.map(async (scenario) => this.scenarioRepository.findById(scenario))
    await Promise.all(scenarioPromises)

    const connection = await this.databaseService.getConnection()
    const slug = await generateSlug({
      value: showcase.name,
      id,
      connection,
      schema: showcases,
    })

    return connection.transaction(async (tx): Promise<Showcase> => {
      const [showcaseResult] = await tx
        .update(showcases)
        .set({
          ...showcase,
          slug,
        })
        .where(eq(showcases.id, id))
        .returning()

      await tx.delete(showcasesToCredentialDefinitions).where(eq(showcasesToCredentialDefinitions.showcase, id))
      await tx.delete(showcasesToPersonas).where(eq(showcasesToPersonas.showcase, id))
      await tx.delete(showcasesToScenarios).where(eq(showcasesToScenarios.showcase, id))

      const showcasesToScenariosResult = await tx
        .insert(showcasesToScenarios)
        .values(
          showcase.scenarios.map((scenarioId: string) => ({
            showcase: showcaseResult.id,
            scenario: scenarioId,
          })),
        )
        .returning()

      const scenariosResult = await tx.query.scenarios.findMany({
        where: inArray(
          scenarios.id,
          showcasesToScenariosResult.map((item) => item.scenario),
        ),
        with: {
          steps: {
            with: {
              actions: {
                with: {
                  proofRequest: true,
                },
              },
              asset: true,
            },
          },
          relyingParty: {
            with: {
              cds: {
                with: {
                  cd: {
                    with: {
                      icon: true,
                      cs: {
                        with: {
                          attributes: true,
                        },
                      },
                      representations: true,
                      revocation: true,
                    },
                  },
                },
              },
              logo: true,
            },
          },
          issuer: {
            with: {
              cds: {
                with: {
                  cd: {
                    with: {
                      icon: true,
                      cs: {
                        with: {
                          attributes: true,
                        },
                      },
                      representations: true,
                      revocation: true,
                    },
                  },
                },
              },
              css: {
                with: {
                  cs: {
                    with: {
                      attributes: true,
                    },
                  },
                },
              },
              logo: true,
            },
          },
          personas: {
            with: {
              persona: {
                with: {
                  headshotImage: true,
                  bodyImage: true,
                },
              },
            },
          },
          bannerImage: true,
        },
      })

      const showcasesToCredentialDefinitionsResult = await tx
        .insert(showcasesToCredentialDefinitions)
        .values(
          showcase.credentialDefinitions.map((credentialDefinitionId: string) => ({
            showcase: showcaseResult.id,
            credentialDefinition: credentialDefinitionId,
          })),
        )
        .returning()

      const credentialDefinitionsResult = await tx.query.credentialDefinitions.findMany({
        where: inArray(
          credentialDefinitions.id,
          showcasesToCredentialDefinitionsResult.map((item) => item.credentialDefinition),
        ),
        with: {
          cs: {
            with: {
              attributes: true,
            },
          },
          representations: true,
          revocation: true,
          icon: true,
        },
      })

      const showcasesToPersonasResult = await tx
        .insert(showcasesToPersonas)
        .values(
          showcase.personas.map((personaId: string) => ({
            showcase: showcaseResult.id,
            persona: personaId,
          })),
        )
        .returning()

      const personasResult = await tx.query.personas.findMany({
        where: inArray(
          personas.id,
          showcasesToPersonasResult.map((item) => item.persona),
        ),
        with: {
          headshotImage: true,
          bodyImage: true,
        },
      })

      return {
        ...showcaseResult,
        scenarios: scenariosResult.map((scenario) => ({
          ...scenario,
          steps: sortSteps(scenario.steps),
          relyingParty: scenario.relyingParty ? {
            id: scenario.relyingParty.id,
            name: scenario.relyingParty.name,
            type: scenario.relyingParty.type,
            description: scenario.relyingParty.description,
            organization: scenario.relyingParty.organization,
            logo: scenario.relyingParty.logo,
            credentialDefinitions: scenario.relyingParty!.cds.map((credentialDefinition: any) => credentialDefinition.cd),
            createdAt: scenario.relyingParty.createdAt,
            updatedAt: scenario.relyingParty.updatedAt,
          } : undefined,
          issuer: scenario.issuer ? {
            id: scenario.issuer.id,
            name: scenario.issuer.name,
            type: scenario.issuer.type,
            description: scenario.issuer.description,
            organization: scenario.issuer.organization,
            logo: scenario.issuer.logo,
            credentialDefinitions: scenario.issuer!.cds.map((credentialDefinition: any) => credentialDefinition.cd),
            credentialSchemas: scenario.issuer!.css.map((credentialSchema: any) => credentialSchema.cs),
            createdAt: scenario.issuer.createdAt,
            updatedAt: scenario.issuer.updatedAt,
          } : undefined,
          personas: scenario.personas.map((item: any) => item.persona),
        })),
        credentialDefinitions: credentialDefinitionsResult.map((item: any) => ({
          ...item,
          credentialSchema: item.cs,
        })),
        personas: personasResult,
        bannerImage: bannerImageResult,
      }
    })
  }

  async findById(id: string): Promise<Showcase> {
    const prepared = (await this.databaseService.getConnection()).query.showcases
      .findFirst({
        where: eq(showcases.id, id),
        with: {
          credentialDefinitions: {
            with: {
              credentialDefinition: {
                with: {
                  icon: true,
                  cs: {
                    with: {
                      attributes: true,
                    },
                  },
                  representations: true,
                  revocation: true,
                },
              },
            },
          },
          scenarios: {
            with: {
              scenario: {
                with: {
                  steps: {
                    with: {
                      actions: {
                        with: {
                          proofRequest: true,
                        },
                      },
                      asset: true,
                    },
                  },
                  issuer: {
                    with: {
                      cds: {
                        with: {
                          cd: {
                            with: {
                              icon: true,
                              cs: {
                                with: {
                                  attributes: true,
                                },
                              },
                              representations: true,
                              revocation: true,
                            },
                          },
                        },
                      },
                      css: {
                        with: {
                          cs: {
                            with: {
                              attributes: true,
                            },
                          },
                        },
                      },
                      logo: true,
                    },
                  },
                  relyingParty: {
                    with: {
                      cds: {
                        with: {
                          cd: {
                            with: {
                              icon: true,
                              cs: {
                                with: {
                                  attributes: true,
                                },
                              },
                              representations: true,
                              revocation: true,
                            },
                          },
                        },
                      },
                      logo: true,
                    },
                  },
                  personas: {
                    with: {
                      persona: {
                        with: {
                          headshotImage: true,
                          bodyImage: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          personas: {
            with: {
              persona: {
                with: {
                  headshotImage: true,
                  bodyImage: true,
                },
              },
            },
          },
          bannerImage: true,
        },
      })
      .prepare('statement_name')

    const result = await prepared.execute()

    if (!result) {
      return Promise.reject(new NotFoundError(`No showcase found for id: ${id}`))
    }

    return {
      ...result,
      scenarios: result.scenarios.map((scenario: any) => ({
        ...(scenario.scenario as any),
        steps: sortSteps(scenario.scenario.steps),
        relyingParty: scenario.relyingParty ? {
          relyingParty: {
            id: scenario.scenario.relyingParty.id,
            name: scenario.scenario.relyingParty.name,
            type: scenario.scenario.relyingParty.type,
            description: scenario.scenario.relyingParty.description,
            organization: scenario.scenario.relyingParty.organization,
            logo: scenario.scenario.relyingParty.logo,
            credentialDefinitions: scenario.scenario.relyingParty!.cds.map((credentialDefinition: any) => credentialDefinition.cd),
            createdAt: scenario.scenario.relyingParty.createdAt,
            updatedAt: scenario.scenario.relyingParty.updatedAt,
          },
        } : undefined,
        issuer: scenario.issuer ? {
          id: scenario.scenario.issuer.id,
          name: scenario.scenario.issuer.name,
          type: scenario.scenario.issuer.type,
          description: scenario.scenario.issuer.description,
          organization: scenario.scenario.issuer.organization,
          logo: scenario.scenario.issuer.logo,
          credentialDefinitions: scenario.scenario.issuer!.cds.map((credentialDefinition: any) => credentialDefinition.cd),
          credentialSchemas: scenario.scenario.issuer!.css.map((credentialSchema: any) => credentialSchema.cs),
          createdAt: scenario.scenario.issuer.createdAt,
          updatedAt: scenario.scenario.issuer.updatedAt,
        } : undefined,
        personas: scenario.scenario.personas.map((item: any) => item.persona),
      })),
      credentialDefinitions: result.credentialDefinitions.map((item: any) => ({
        ...item.credentialDefinition,
        credentialSchema: item.credentialDefinition.cs,
      })),
      personas: result.personas.map((item: any) => item.persona),
    }
  }

  async findAll(): Promise<Showcase[]> {
    const connection = await this.databaseService.getConnection()
    const showcases = await connection.query.showcases.findMany({
      with: { bannerImage: true },
    })
    const showcaseIds = showcases.map((s: any) => s.id)

    const [credDefData, scenariosData, personasData] = await Promise.all([
      connection.query.showcasesToCredentialDefinitions.findMany({
        where: inArray(showcasesToCredentialDefinitions.showcase, showcaseIds),
        with: {
          credentialDefinition: {
            with: {
              icon: true,
              cs: {
                with: {
                  attributes: true,
                },
              },
              representations: true,
              revocation: true,
            },
          },
        },
      }),
      connection.query.showcasesToScenarios.findMany({
        where: inArray(showcasesToScenarios.showcase, showcaseIds),
        with: {
          scenario: {
            with: {
              steps: {
                with: {
                  actions: {
                    with: {
                      proofRequest: true,
                    },
                  },
                  asset: true,
                },
              },
              issuer: {
                with: {
                  cds: {
                    with: {
                      cd: {
                        with: {
                          icon: true,
                          cs: {
                            with: {
                              attributes: true,
                            },
                          },
                          representations: true,
                          revocation: true,
                        },
                      },
                    },
                  },
                  css: {
                    with: {
                      cs: {
                        with: {
                          attributes: true,
                        },
                      },
                    },
                  },
                  logo: true,
                },
              },
              relyingParty: {
                with: {
                  cds: {
                    with: {
                      cd: {
                        with: {
                          icon: true,
                          cs: {
                            with: {
                              attributes: true,
                            },
                          },
                          representations: true,
                          revocation: true,
                        },
                      },
                    },
                  },
                  logo: true,
                },
              },
              personas: {
                with: {
                  persona: {
                    with: {
                      headshotImage: true,
                      bodyImage: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      connection.query.showcasesToPersonas.findMany({
        where: inArray(showcasesToPersonas.showcase, showcaseIds),
        with: {
          persona: {
            with: {
              headshotImage: true,
              bodyImage: true,
            },
          },
        },
      }),
    ])

    // Group join records by showcase id
    const credDefMap = new Map<string, any[]>()
    for (const item of credDefData) {
      const key = item.showcase
      if (!credDefMap.has(key)) {
        credDefMap.set(key, [])
      }
      credDefMap.get(key)!.push(item)
    }

    const scenariosMap = new Map<string, any[]>()
    for (const item of scenariosData) {
      const key = item.showcase
      if (!scenariosMap.has(key)) {
        scenariosMap.set(key, [])
      }
      scenariosMap.get(key)!.push(item)
    }

    const personasMap = new Map<string, any[]>()
    for (const item of personasData) {
      const key = item.showcase
      if (!personasMap.has(key)) {
        personasMap.set(key, [])
      }
      personasMap.get(key)!.push(item)
    }

    return showcases.map((showcase: any) => {
      return {
        ...showcase,
        scenarios: (scenariosMap.get(showcase.id) || []).map((s: any) => {
          const scenarioData = { ...s.scenario }
          scenarioData.steps = sortSteps(s.scenario.steps)
          if (s.scenario.relyingParty) {
            scenarioData.relyingParty = {
              ...s.scenario.relyingParty,
              credentialDefinitions: s.scenario.relyingParty.cds.map((item: any) => item.cd),
            }
          }
          if (s.scenario.issuer) {
            scenarioData.issuer = {
              ...s.scenario.issuer,
              credentialDefinitions: s.scenario.issuer.cds.map((item: any) => item.cd),
              credentialSchemas: s.scenario.issuer.css.map((item: any) => item.cs),
            }
          }
          // TODO check this typing issue at a later point in time
          scenarioData.personas = s.scenario.personas.map((p: any) => p.persona)
          return scenarioData
        }),
        credentialDefinitions: (credDefMap.get(showcase.id) || []).map((item: any) => {
          return {
            ...item.credentialDefinition,
            credentialSchema: item.credentialDefinition.cs,
          }
          // TODO check this typing issue at a later point in time
        }),
        personas: (personasMap.get(showcase.id) || []).map((item: any) => item.persona),
      }
    })
  }

  async findIdBySlug(slug: string): Promise<string> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.showcases.findFirst({
      where: eq(showcases.slug, slug),
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No showcase found for slug: ${slug}`))
    }

    return result.id
  }
}

export default ShowcaseRepository
