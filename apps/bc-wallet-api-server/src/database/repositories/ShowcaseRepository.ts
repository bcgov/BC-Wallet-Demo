import { eq, inArray, isNull } from 'drizzle-orm'
import { Service } from 'typedi'
import { BadRequestError } from 'routing-controllers'
import DatabaseService from '../../services/DatabaseService'
import PersonaRepository from './PersonaRepository'
import ScenarioRepository from './ScenarioRepository'
import AssetRepository from './AssetRepository'
import { sortSteps } from '../../utils/sort'
import { generateSlug } from '../../utils/slug'
import { NotFoundError } from '../../errors'
import {
  personas,
  scenarios,
  showcases,
  showcasesToCredentialDefinitions,
  showcasesToPersonas,
  showcasesToScenarios,
} from '../schema'
import { NewShowcase, RepositoryDefinition, Showcase } from '../../types'
import UserRepository from './UserRepository'

@Service()
class ShowcaseRepository implements RepositoryDefinition<Showcase, NewShowcase> {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly personaRepository: PersonaRepository,
    private readonly scenarioRepository: ScenarioRepository,
    private readonly assetRepository: AssetRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async create(showcase: NewShowcase): Promise<Showcase> {
    if (showcase.personas.length === 0) {
      return Promise.reject(new BadRequestError('At least one persona is required'))
    }
    if (showcase.scenarios.length === 0) {
      return Promise.reject(new BadRequestError('At least one scenario is required'))
    }
    const createdByResult = showcase?.createdBy ? await this.userRepository.findById(showcase.createdBy) : null
    const approvedByResult = showcase?.approvedBy ? await this.userRepository.findById(showcase.approvedBy) : null
    const bannerImageResult = showcase.bannerImage ? await this.assetRepository.findById(showcase.bannerImage) : null
    const personaPromises = showcase.personas.map(async (persona) => await this.personaRepository.findById(persona))
    await Promise.all(personaPromises)
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
        scenarios: (scenariosResult || []).map(scenario => this.mapScenarioRelations(scenario)),
        personas: personasResult,
        bannerImage: bannerImageResult,
        approvedBy: approvedByResult,
        createdBy: createdByResult,
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
    if (showcase.scenarios.length === 0) {
      return Promise.reject(new BadRequestError('At least one scenario is required'))
    }

    const createdByResult = showcase?.createdBy ? await this.userRepository.findById(showcase.createdBy) : null
    const approvedByResult = showcase?.approvedBy ? await this.userRepository.findById(showcase.approvedBy) : null
    const bannerImageResult = showcase.bannerImage ? await this.assetRepository.findById(showcase.bannerImage) : null

    const personaPromises = showcase.personas.map(async (persona) => await this.personaRepository.findById(persona))
    await Promise.all(personaPromises)
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
        ...(showcaseResult as any), // TODO check this typing issue at a later point in time
        scenarios: (scenariosResult || []).map(scenario => this.mapScenarioRelations(scenario)),
        personas: personasResult,
        bannerImage: bannerImageResult,
        createdBy: createdByResult,
        approvedBy: approvedByResult,
      }
    })
  }

  async findById(id: string): Promise<Showcase> {
    const prepared = (await this.databaseService.getConnection()).query.showcases
      .findFirst({
        where: eq(showcases.id, id),
        with: {
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
          createdBy: true,
        },
      })
      .prepare('statement_name')

    const result = await prepared.execute()

    if (!result) {
      return Promise.reject(new NotFoundError(`No showcase found for id: ${id}`))
    }

    return {
      ...(result as any), // TODO check this typing issue at a later point in time
      scenarios: (result.scenarios || []).map(scenario => this.mapScenarioRelations(scenario)),
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
              approver: true,
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
                          approver: true,
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
                          approver: true,
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
        scenarios: (scenariosMap.get(showcase.id) || []).map(scenario => this.mapScenarioRelations(scenario)),
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


  async findUnapproved(): Promise<Showcase[]> {
    const results = await (
      await this.databaseService.getConnection()
    ).query.showcases.findMany({
      where: isNull(showcases.approvedAt),
      with: {
        scenarios: {
          with: {
            scenario: {
              with: {
                steps: { with: { actions: { with: { proofRequest: true } }, asset: true } },
                issuer: {
                  with: {
                    cds: {
                      with: {
                        cd: {
                          with: {
                            icon: true,
                            cs: { with: { attributes: true } },
                            representations: true,
                            revocation: true,
                            approver: true,
                          },
                        },
                      },
                    },
                    css: { with: { cs: { with: { attributes: true } } } },
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
                            cs: { with: { attributes: true } },
                            representations: true,
                            revocation: true,
                            approver: true,
                          },
                        },
                      },
                    },
                    logo: true,
                  },
                },
                personas: { with: { persona: { with: { headshotImage: true, bodyImage: true } } } },
              },
            },
          },
        },
        personas: { with: { persona: { with: { headshotImage: true, bodyImage: true } } } },
        bannerImage: true,
        createdBy: true,
        approver: true,
      },
    })

    // Map results using the same logic as findById
    return results.map(result => ({
      ...result,

      // Map relations
      scenarios: (result.scenarios || []).map(s => this.mapScenarioRelations(s.scenario)),
      personas: (result.personas || []).map(p => p.persona),
      bannerImage: result.bannerImage ?? undefined,
      createdBy: result.createdBy ?? undefined,
      approvedBy: result.approver
    }))
  }

  async approve(id: string, userId: string): Promise<Showcase> {
    const now = new Date()
    await (await this.databaseService.getConnection())
      .update(showcases)
      .set({
        approvedBy: userId,
        approvedAt: now,
        updatedAt: now // Also update updatedAt timestamp
      })
      .where(eq(showcases.id, id))

    // Re-fetch the updated record with all relations to return it
    return this.findById(id)
  }

  private mapScenarioRelations(scenarioData: any): any {
    const mappedScenario = {
      ...scenarioData,
      steps: sortSteps(scenarioData.steps),
      personas: (scenarioData.personas || []).map((p: any) => p.persona),
    }

    if (scenarioData.relyingParty) {
      mappedScenario.relyingParty = {
        ...scenarioData.relyingParty,
        credentialDefinitions: (scenarioData.relyingParty.cds || []).map((cdJoin: any) => ({
          ...cdJoin.cd,
          credentialSchema: cdJoin.cd.cs,
          icon: cdJoin.cd.icon ?? undefined,
          representations: cdJoin.cd.representations ?? [],
          revocation: cdJoin.cd.revocation ?? undefined,
          approvedBy: cdJoin.cd.approver ?? undefined,
          approvedAt: cdJoin.cd.approvedAt ?? undefined,
        })),
        logo: scenarioData.relyingParty.logo ?? undefined,
      }
    } else {
      delete mappedScenario.relyingParty
    }

    if (scenarioData.issuer) {
      mappedScenario.issuer = {
        ...scenarioData.issuer,
        credentialDefinitions: (scenarioData.issuer.cds || []).map((cdJoin: any) => ({
          ...cdJoin.cd,
          credentialSchema: cdJoin.cd.cs, // Map nested schema
          icon: cdJoin.cd.icon ?? undefined,
          representations: cdJoin.cd.representations ?? [],
          revocation: cdJoin.cd.revocation ?? undefined,
          approvedBy: cdJoin.cd.approver ?? undefined,
          approvedAt: cdJoin.cd.approvedAt ?? undefined,
        })),
        credentialSchemas: (scenarioData.issuer.css || []).map((csJoin: any) => ({
          ...csJoin.cs,
          attributes: csJoin.cs.attributes ?? [],
        })),
        logo: scenarioData.issuer.logo ?? undefined,
      }
    } else {
      delete mappedScenario.issuer
    }

    return mappedScenario
  }
}

export default ShowcaseRepository
