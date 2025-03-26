import { useState, useCallback } from 'react'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import type { Persona, StepRequestType, AriesOOBActionRequest, PresentationScenarioRequestType } from '@/openapi-types'
import { sampleAction } from '@/lib/steps'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { usePersonas } from './use-personas'

export const usePresentationCreation = () => {
  const { selectedPersonaIds } = useShowcaseStore()
  const [activeScenarioIndex, setActiveScenarioIndex] = useState<number>(0)

  const { relayerId, selectedCredentialDefinitionIds } = useHelpersStore()
  const { data: personasData } = usePersonas()

  const [personaScenarios, setPersonaScenarios] = useState(() => {
    const initialScenarios = new Map<string, PresentationScenarioRequestType[]>()

    const personas = (personasData?.personas || []).filter((persona: Persona) =>
      selectedPersonaIds.includes(persona.id),
    )

    personas.forEach((persona: Persona) => {
      initialScenarios.set(persona.id, [
        {
          name: 'Add your students exam results',
          description: `Onboarding scenario for ${persona.name}`,
          type: 'PRESENTATION',
          steps: [
            {
              title: `Scan the QR Code to start sharing`,
              description: `Imagine, as Ana, you are logged into the BestBC College website (see below). They want to offer you a Digital Student Card. Use your BC Wallet to scan the QR code from the website.`,
              order: 0,
              type: 'HUMAN_TASK',
              actions: [sampleAction],
            },
          ],
          personas: [persona.id],
          hidden: false,
          relyingParty: relayerId,
        },
      ])
    })

    return initialScenarios
  })

  const [activePersonaId, setActivePersonaId] = useState<string | null>(() => {
    const personas = (personasData?.personas || []).filter((persona: Persona) =>
      selectedPersonaIds.includes(persona.id),
    )
    return personas.length > 0 ? personas[0].id : null
  })

  const selectedPersonas = (personasData?.personas || []).filter((persona: Persona) =>
    selectedPersonaIds.includes(persona.id),
  )

  const updatePersonaSteps = useCallback((personaId: string, scenarioIndex: number, steps: StepRequestType[]) => {
    setPersonaScenarios((prevScenarios) => {
      if (!prevScenarios.has(personaId)) {
        return prevScenarios
      }

      const scenarios = prevScenarios.get(personaId)!

      if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) {
        return prevScenarios
      }

      // Update the steps of the specified scenario
      const updatedScenarios = [...scenarios]
      updatedScenarios[scenarioIndex] = {
        ...updatedScenarios[scenarioIndex],
        steps: steps,
      }

      const newScenarios = new Map(prevScenarios)
      newScenarios.set(personaId, updatedScenarios)

      return newScenarios
    })
  }, [])

  const addActionToStep = useCallback(
    (personaId: string, stepIndex: number, action: typeof AriesOOBActionRequest._type) => {
      setPersonaScenarios((prevScenarios) => {
        if (!prevScenarios.has(personaId)) {
          return prevScenarios
        }

        const scenario = prevScenarios.get(personaId)!
        const steps = [...scenario.steps]

        if (stepIndex < 0 || stepIndex >= steps.length) {
          return prevScenarios
        }

        const step = steps[stepIndex]
        const actions = [...(step.actions || []), action]

        steps[stepIndex] = { ...step, actions }

        const newScenarios = new Map(prevScenarios)
        newScenarios.set(personaId, {
          ...scenario,
          steps: steps,
        })

        return newScenarios
      })
    },
    [],
  )

  const addPersonaScenario = useCallback((persona: Persona) => {
    setPersonaScenarios((prevScenarios) => {
      if (prevScenarios.has(persona.id)) {
        return prevScenarios
      }

      const defaultScenario: PresentationScenarioRequestType = {
        name: "You're done!",
        description: `Onboarding scenario for ${persona.name}`,
        type: 'PRESENTATION',
        steps: [
          {
            title: `Scan the QR Code to start sharing`,
            description: `Imagine, as Ana, you are logged into the BestBC College website (see below). They want to offer you a Digital Student Card. Use your BC Wallet to scan the QR code from the website.`,
            order: 0,
            type: 'HUMAN_TASK',
            actions: [],
          },
        ],
        personas: [persona.id],
        hidden: false,
        relyingParty: relayerId,
      }

      const newScenarios = new Map(prevScenarios)
      newScenarios.set(persona.id, defaultScenario as PresentationScenarioRequestType)
      return newScenarios
    })
  }, [])

  const duplicateScenario = useCallback(
    (scenarioIndex: number) => {
      if (!activePersonaId) return
  
      setPersonaScenarios((prevScenarios: any) => {
        const newScenarios = new Map(prevScenarios)
        
        const personaScenarioList = Array.isArray(prevScenarios.get(activePersonaId))
          ? [...prevScenarios.get(activePersonaId)]
          : [prevScenarios.get(activePersonaId)]
        
        const scenarioToDuplicate = personaScenarioList[scenarioIndex]
        if (!scenarioToDuplicate) return prevScenarios
        
        const duplicatedScenario = JSON.parse(JSON.stringify(scenarioToDuplicate))
        duplicatedScenario.name = `${duplicatedScenario.name} (Copy)`
        
        // Set new scenario index to the array length (which will be its index after adding)
        const newScenarioIndex = personaScenarioList.length;
        
        // Update all steps to have the new scenario index
        duplicatedScenario.steps = duplicatedScenario.steps.map((step: StepRequestType, idx: number) => ({
          ...step,
          id: `step-${newScenarioIndex}-${idx}-${Date.now()}`,
          scenarioIndex: newScenarioIndex
        }))
        
        personaScenarioList.push(duplicatedScenario)
        newScenarios.set(activePersonaId, personaScenarioList)
        
        return newScenarios
      })
    },
    [activePersonaId],
  )

  const deleteScenario = useCallback(
    (scenarioIndex: number) => {
      if (!activePersonaId) return
  
      setPersonaScenarios((prevScenarios) => {
        // Get current scenarios for the active persona
        const currentScenarios = prevScenarios.get(activePersonaId)
        if (!currentScenarios || !Array.isArray(currentScenarios)) return prevScenarios
        
        // Create a new array without the scenario at the specified index
        const updatedScenarios = [
          ...currentScenarios.slice(0, scenarioIndex),
          ...currentScenarios.slice(scenarioIndex + 1)
        ]
        
        // Create a new map with the updated scenarios for this persona
        const newScenarios = new Map(prevScenarios)
        newScenarios.set(activePersonaId, updatedScenarios)
        
        // Update active scenario index if needed
        if (scenarioIndex === activeScenarioIndex && updatedScenarios.length > 0) {
          setActiveScenarioIndex(0)
        } else if (scenarioIndex < activeScenarioIndex) {
          setActiveScenarioIndex(activeScenarioIndex - 1)
        }
        
        return newScenarios
      })
    },
    [activePersonaId, activeScenarioIndex, setActiveScenarioIndex]
  )

  return {
    selectedPersonas,
    selectedCredentialDefinitionIds,
    personaScenarios,
    activePersonaId,
    setActivePersonaId,
    updatePersonaSteps,
    addActionToStep,
    addPersonaScenario,
    duplicateScenario,
    activeScenarioIndex,
    setActiveScenarioIndex,
    deleteScenario
  }
}
