import { eq, inArray, isNull } from 'drizzle-orm'
import { NotFoundError } from 'routing-controllers'
import { Service } from 'typedi'

import DatabaseService from '../../services/DatabaseService'
import { NewShowcase, Persona, RepositoryDefinition, Scenario, Showcase, Step, Tx } from '../../types'
import { generateSlug } from '../../utils/slug'
import { sortSteps } from '../../utils/sort'
import {
  personas,
  scenarios,
  showcases,
  showcasesToCredentialDefinitions,
  showcasesToPersonas,
  showcasesToScenarios,
} from '../schema'
import AssetRepository from './AssetRepository'
import PersonaRepository from './PersonaRepository'
import ScenarioRepository from './ScenarioRepository'
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
    let scenariosResult: Scenario[] = []
    let personasResult: Persona[] = []

    const createdByResult = showcase?.createdBy ? await this.userRepository.findById(showcase.createdBy) : null
    const approvedByResult = showcase?.approvedBy ? await this.userRepository.findById(showcase.approvedBy) : null
    const bannerImageResult = showcase.bannerImage ? await this.assetRepository.findById(showcase.bannerImage) : null

    const connection = await this.databaseService.getConnection()
    const slug = await generateSlug({
      value: showcase.name,
      connection,
      schema: showcases,
    })

    return connection.transaction(async (tx: Tx): Promise<Showcase> => {
      const [showcaseResult] = await tx
        .insert(showcases)
        .values({
          ...showcase,
          slug,
        })
        .returning()

      if (showcase.scenarios.length > 0) {
        const scenarioPromises = showcase.scenarios.map(async (scenario) =>
          this.scenarioRepository.findById(scenario, tx),
        )
        await Promise.all(scenarioPromises)

        const showcasesToScenariosResult = await tx
          .insert(showcasesToScenarios)
          .values(
            showcase.scenarios.map((scenarioId: string) => ({
              showcase: showcaseResult.id,
              scenario: scenarioId,
            })),
          )
          .returning()

        scenariosResult = await tx.query.scenarios
          .findMany({
            where: inArray(
              scenarios.id,
              showcasesToScenariosResult.map((item) => item.scenario).filter((id): id is string => id !== null),
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
          .then((scenarios) =>
            scenarios.map((scenario) => ({
              id: scenario.id,
              name: scenario.name,
              slug: scenario.slug,
              description: scenario.description,
              scenarioType: scenario.scenarioType,
              hidden: scenario.hidden,
              createdAt: scenario.createdAt,
              updatedAt: scenario.updatedAt,
              bannerImage: scenario.bannerImage,
              steps: sortSteps(scenario.steps as Step[]),
              personas: scenario.personas.map((p) => p.persona),
              relyingParty: scenario.relyingParty
                ? {
                    id: scenario.relyingParty.id,
                    name: scenario.relyingParty.name,
                    type: scenario.relyingParty.type,
                    description: scenario.relyingParty.description,
                    organization: scenario.relyingParty.organization,
                    logo: scenario.relyingParty.logo,
                    credentialDefinitions: scenario.relyingParty.cds.map((cd: any) => ({
                      ...cd.cd,
                      icon: cd.cd.icon || undefined,
                      credentialSchema: cd.cd.cs,
                    })),
                    createdAt: scenario.relyingParty.createdAt,
                    updatedAt: scenario.relyingParty.updatedAt,
                  }
                : undefined,
              issuer: scenario.issuer
                ? {
                    id: scenario.issuer.id,
                    name: scenario.issuer.name,
                    type: scenario.issuer.type,
                    description: scenario.issuer.description,
                    organization: scenario.issuer.organization,
                    logo: scenario.issuer.logo,
                    credentialDefinitions: scenario.issuer.cds.map((cd: any) => ({
                      ...cd.cd,
                      icon: cd.cd.icon || undefined,
                      credentialSchema: cd.cd.cs,
                    })),
                    credentialSchemas: scenario.issuer.css.map((cs: any) => cs.cs),
                    createdAt: scenario.issuer.createdAt,
                    updatedAt: scenario.issuer.updatedAt,
                  }
                : undefined,
            })),
          )
      }

      if (showcase.personas.length > 0) {
        const personaPromises = showcase.personas.map(
          async (persona) => await this.personaRepository.findById(persona, tx),
        )
        await Promise.all(personaPromises)

        const showcasesToPersonasResult = await tx
          .insert(showcasesToPersonas)
          .values(
            showcase.personas.map((personaId: string) => ({
              showcase: showcaseResult.id,
              persona: personaId,
            })),
          )
          .returning()

        personasResult = await tx.query.personas.findMany({
          where: inArray(
            personas.id,
            showcasesToPersonasResult.map((item) => item.persona).filter((id): id is string => id !== null),
          ),
          with: {
            headshotImage: true,
            bodyImage: true,
          },
        })
      }

      return {
        ...(showcaseResult as any), // TODO check this typing issue at a later point in time
        scenarios: scenariosResult,
        personas: personasResult,
        bannerImage: bannerImageResult,
        createdBy: createdByResult,
        approvedBy: approvedByResult,
      }
    })
  }

  public async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(showcases).where(eq(showcases.id, id))
  }

  public async update(id: string, showcase: NewShowcase): Promise<Showcase> {
    const existingShowcase = await this.findById(id)

    if (existingShowcase.approvedBy) {
      throw new Error('Showcase is already approved and cannot be updated')
    }

    let scenariosResult: Scenario[] = []
    let personasResult: Persona[] = []
    let slug: string | undefined

    const createdByResult = showcase?.createdBy ? await this.userRepository.findById(showcase.createdBy) : null
    const approvedByResult = showcase?.approvedBy ? await this.userRepository.findById(showcase.approvedBy) : null
    const bannerImageResult = showcase.bannerImage ? await this.assetRepository.findById(showcase.bannerImage) : null

    const connection = await this.databaseService.getConnection()

    if (showcase.name !== (await this.findById(id)).name) {
      slug = await generateSlug({
        value: showcase.name,
        id,
        connection,
        schema: showcases,
      })
    } else {
      slug = (await this.findById(id)).slug
    }

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

      if (showcase.scenarios.length > 0) {
        const scenarioPromises = showcase.scenarios.map(async (scenario) =>
          this.scenarioRepository.findById(scenario, tx),
        )
        await Promise.all(scenarioPromises)

        const showcasesToScenariosResult =
          (await tx
            .insert(showcasesToScenarios)
            .values(
              showcase.scenarios.map((scenarioId: string) => ({
                showcase: showcaseResult.id,
                scenario: scenarioId,
              })),
            )
            .returning()) || []

        scenariosResult = await tx.query.scenarios
          .findMany({
            where: inArray(
              scenarios.id,
              showcasesToScenariosResult.map((item) => item.scenario).filter((id): id is string => id !== null),
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
          .then((scenarios) =>
            scenarios.map((scenario) => ({
              id: scenario.id,
              name: scenario.name,
              slug: scenario.slug,
              description: scenario.description,
              scenarioType: scenario.scenarioType,
              hidden: scenario.hidden,
              createdAt: scenario.createdAt,
              updatedAt: scenario.updatedAt,
              bannerImage: scenario.bannerImage,
              steps: sortSteps(scenario.steps as Step[]),
              personas: scenario.personas.map((p) => p.persona),
              relyingParty: scenario.relyingParty
                ? {
                    id: scenario.relyingParty.id,
                    name: scenario.relyingParty.name,
                    type: scenario.relyingParty.type,
                    description: scenario.relyingParty.description,
                    organization: scenario.relyingParty.organization,
                    logo: scenario.relyingParty.logo,
                    credentialDefinitions: scenario.relyingParty.cds.map((cd: any) => ({
                      ...cd.cd,
                      icon: cd.cd.icon || undefined,
                      credentialSchema: cd.cd.cs,
                    })),
                    createdAt: scenario.relyingParty.createdAt,
                    updatedAt: scenario.relyingParty.updatedAt,
                  }
                : undefined,
              issuer: scenario.issuer
                ? {
                    id: scenario.issuer.id,
                    name: scenario.issuer.name,
                    type: scenario.issuer.type,
                    description: scenario.issuer.description,
                    organization: scenario.issuer.organization,
                    logo: scenario.issuer.logo,
                    credentialDefinitions: scenario.issuer.cds.map((cd: any) => ({
                      ...cd.cd,
                      icon: cd.cd.icon || undefined,
                      credentialSchema: cd.cd.cs,
                    })),
                    credentialSchemas: scenario.issuer.css.map((cs: any) => cs.cs),
                    createdAt: scenario.issuer.createdAt,
                    updatedAt: scenario.issuer.updatedAt,
                  }
                : undefined,
            })),
          )
      }

      if (showcase.personas.length > 0) {
        const personaPromises = showcase.personas.map(
          async (persona) => await this.personaRepository.findById(persona, tx),
        )
        await Promise.all(personaPromises)

        const showcasesToPersonasResult = await tx
          .insert(showcasesToPersonas)
          .values(
            showcase.personas.map((personaId: string) => ({
              showcase: showcaseResult.id,
              persona: personaId,
            })),
          )
          .returning()

        personasResult = await tx.query.personas.findMany({
          where: inArray(
            personas.id,
            showcasesToPersonasResult.map((item) => item.persona).filter((id): id is string => id !== null),
          ),
          with: {
            headshotImage: true,
            bodyImage: true,
          },
        })
      }

      return {
        ...(showcaseResult as any), // TODO check this typing issue at a later point in time
        scenarios: scenariosResult,
        personas: personasResult,
        bannerImage: bannerImageResult,
        createdBy: createdByResult,
        approvedBy: approvedByResult,
      }
    })
  }

  async findById(id: string, tx?: Tx): Promise<Showcase> {
    const findShowcaseById = `find_showcase_by_id_${id}`
    const prepared = (tx ?? (await this.databaseService.getConnection())).query.showcases
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
          approver: true,
        },
      })
      .prepare(findShowcaseById)

    const result = await prepared.execute()

    if (!result) {
      return Promise.reject(new NotFoundError(`No showcase found for id: ${id}`))
    }

    return {
      ...result,
      scenarios: result.scenarios.map((scenario: any) => ({
        ...scenario.scenario,
        steps: sortSteps(scenario.scenario.steps),
        ...(scenario.scenario.relyingParty && {
          relyingParty: {
            id: scenario.scenario.relyingParty.id,
            name: scenario.scenario.relyingParty.name,
            type: scenario.scenario.relyingParty.type,
            description: scenario.scenario.relyingParty.description,
            organization: scenario.scenario.relyingParty.organization,
            logo: scenario.scenario.relyingParty.logo,
            credentialDefinitions: scenario.scenario.relyingParty.cds.map((cd: any) => cd.cd),
            createdAt: scenario.scenario.relyingParty.createdAt,
            updatedAt: scenario.scenario.relyingParty.updatedAt,
          },
        }),
        ...(scenario.scenario.issuer && {
          issuer: {
            id: scenario.scenario.issuer.id,
            name: scenario.scenario.issuer.name,
            type: scenario.scenario.issuer.type,
            description: scenario.scenario.issuer.description,
            organization: scenario.scenario.issuer.organization,
            logo: scenario.scenario.issuer.logo,
            credentialDefinitions: scenario.scenario.issuer.cds.map((cd: any) => cd.cd),
            credentialSchemas: scenario.scenario.issuer.css.map((cs: any) => cs.cs),
            createdAt: scenario.scenario.issuer.createdAt,
            updatedAt: scenario.scenario.issuer.updatedAt,
          },
        }),
        personas: scenario.scenario.personas.map((item: any) => item.persona),
      })),
      personas: result.personas.map((item: any) => item.persona),
      approvedBy: result.approver,
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
        scenarios: (scenariosMap.get(showcase.id) || []).map((s: any) => {
          const scenarioData = { ...s.scenario }
          scenarioData.steps = sortSteps(s.scenario.steps)
          if (s.scenario.relyingParty) {
            scenarioData.relyingParty = {
              id: s.scenario.relyingParty.id,
              name: s.scenario.relyingParty.name,
              type: s.scenario.relyingParty.type,
              description: s.scenario.relyingParty.description,
              organization: s.scenario.relyingParty.organization,
              logo: s.scenario.relyingParty.logo,
              credentialDefinitions: s.scenario.relyingParty.cds.map((item: any) => item.cd),
              createdAt: s.scenario.relyingParty.createdAt,
              updatedAt: s.scenario.relyingParty.updatedAt,
            }
          }
          if (s.scenario.issuer) {
            scenarioData.issuer = {
              id: s.scenario.issuer.id,
              name: s.scenario.issuer.name,
              type: s.scenario.issuer.type,
              description: s.scenario.issuer.description,
              organization: s.scenario.issuer.organization,
              logo: s.scenario.issuer.logo,
              credentialDefinitions: s.scenario.issuer.cds.map((item: any) => item.cd),
              credentialSchemas: s.scenario.issuer.css.map((item: any) => item.cs),
              createdAt: s.scenario.issuer.createdAt,
              updatedAt: s.scenario.issuer.updatedAt,
            }
          }
          scenarioData.personas = s.scenario.personas.map((p: any) => p.persona)
          return scenarioData
        }),
        credentialDefinitions: (credDefMap.get(showcase.id) || []).map((item: any) => ({
          ...item.credentialDefinition,
          credentialSchema: item.credentialDefinition.cs,
        })),
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
    return results.map((result) => ({
      ...result,
      scenarios: (result.scenarios || []).map((scenario: any) => ({
        ...scenario.scenario,
        steps: sortSteps(scenario.scenario.steps),
        ...(scenario.scenario.relyingParty && {
          relyingParty: {
            id: scenario.scenario.relyingParty.id,
            name: scenario.scenario.relyingParty.name,
            type: scenario.scenario.relyingParty.type,
            description: scenario.scenario.relyingParty.description,
            organization: scenario.scenario.relyingParty.organization,
            logo: scenario.scenario.relyingParty.logo,
            credentialDefinitions: scenario.scenario.relyingParty.cds.map((cd: any) => cd.cd),
            createdAt: scenario.scenario.relyingParty.createdAt,
            updatedAt: scenario.scenario.relyingParty.updatedAt,
          },
        }),
        ...(scenario.scenario.issuer && {
          issuer: {
            id: scenario.scenario.issuer.id,
            name: scenario.scenario.issuer.name,
            type: scenario.scenario.issuer.type,
            description: scenario.scenario.issuer.description,
            organization: scenario.scenario.issuer.organization,
            logo: scenario.scenario.issuer.logo,
            credentialDefinitions: scenario.scenario.issuer.cds.map((cd: any) => cd.cd),
            credentialSchemas: scenario.scenario.issuer.css.map((cs: any) => cs.cs),
            createdAt: scenario.scenario.issuer.createdAt,
            updatedAt: scenario.scenario.issuer.updatedAt,
          },
        }),
        personas: scenario.scenario.personas.map((item: any) => item.persona),
      })),
      personas: result.personas.map((p: any) => p.persona),
      bannerImage: result.bannerImage ?? undefined,
      createdBy: result.createdBy ?? undefined,
      approvedBy: result.approver,
    }))
  }

  async approve(id: string, userId: string): Promise<Showcase> {
    const now = new Date()
    const connection = await this.databaseService.getConnection()
    return await connection.transaction(async (tx) => {
      await tx
        .update(showcases)
        .set({
          approvedBy: userId,
          approvedAt: now,
          updatedAt: now,
        })
        .where(eq(showcases.id, id))
      return await this.findById(id, tx)
    })
  }
}

export default ShowcaseRepository
