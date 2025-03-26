// @ts-nocheck

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShowcaseStore } from './use-showcase-store'
import { produce } from 'immer'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  PresentationScenarioResponse,
  ScenarioRequestType,
  ScenarioTypeEnum,
  StepRequestType,
  StepResponse,
  StepTypeEnum,
  StepType,
} from '@/openapi-types'
import { ScenarioRequest, StepRequest } from '@/openapi-types'
import apiClient from '@/lib/apiService'

type StepState = 'editing-basic' | 'editing-issue' | 'no-selection' | 'creating-new'

interface State {
  selectedStep: number | null
  stepState: StepState
  screens: StepType[]
  scenarioId: string
  issuerId: string
  currentScenarioIndex: number
}

interface Actions {
  setSelectedStep: (index: number | null) => void
  setStepState: (state: StepState) => void
  initializeScenarios: (screens: StepRequestType[]) => void
  moveStep: (oldIndex: number, newIndex: number) => void
  removeStep: (index: number) => void
  createStep: (step: StepRequestType) => void
  updateStep: (index: number, step: StepRequestType) => void
  setScenarioId: (id: string) => void
  setIssuerId: (id: string) => void
  reset: () => void
  setCurrentScenarioIndex: (index: number) => void
}

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

export const usePresentations = create<State & Actions>()(
  immer((set) => ({
    selectedStep: null,
    stepState: 'no-selection',
    scenarioId: '',
    issuerId: '',
    screens: [],
    currentScenarioIndex: 0,

    setScenarioId: (id) =>
      set((state) => {
        state.scenarioId = id
      }),

    setIssuerId: (id) =>
      set((state) => {
        state.issuerId = id
      }),

    setSelectedStep: (index) =>
      set((state) => {
        state.selectedStep = index
      }),

    setStepState: (newState) =>
      set((state) => {
        state.stepState = newState
      }),

    initializeScenarios: (screens) =>
      set(
        produce((state) => {
          state.screens = deepClone(screens)
        }),
      ),

    moveStep: (oldIndex, newIndex) =>
      set(
        produce((state) => {
          const newScreens = [...state.screens]
          const [movedStep] = newScreens.splice(oldIndex, 1)
          newScreens.splice(newIndex, 0, movedStep)
          state.screens = newScreens
        }),
      ),

    removeStep: (index) =>
      set(
        produce((state) => {
          const newScreens = [...state.screens]
          newScreens.splice(index, 1)
          state.screens = newScreens

          if (state.selectedStep === index) {
            state.selectedStep = null
            state.stepState = 'no-selection'
          }
        }),
      ),

    createStep: (step) =>
      set((state) => {
        const newScreens = [...state.screens, step]
        state.screens = newScreens
        state.selectedStep = newScreens.length - 1
        state.stepState = step.credentials ? 'editing-issue' : 'editing-basic'
      }),

    updateStep: (index, step) =>
      set(
        produce((state) => {
          const newScreens = [...state.screens]
          if (newScreens[index] && newScreens[index].scenarioIndex === state.currentScenarioIndex) {
            newScreens[index] = deepClone({
              ...step,
              scenarioIndex: state.currentScenarioIndex,
            })
          }

          state.screens = newScreens
        }),
      ),

    setCurrentScenarioIndex: (index) =>
      set((state) => {
        state.currentScenarioIndex = index
      }),

    reset: () =>
      set(
        produce((state) => {
          state.selectedStep = null
          state.stepState = 'no-selection'
          state.screens = []
        }),
      ),
  })),
)

export const useCreateStep = () => {
  const [stepType, setStepType] = useState<typeof StepTypeEnum._type | null>(null)

  const stepForm = useForm<typeof StepRequest._type>({
    resolver: zodResolver(StepRequest),
  })

  const handleTypeSelection = (type: typeof StepTypeEnum._type) => {
    setStepType(type)
    stepForm.reset({
      title: '',
      description: '',
      type: type,
      asset: '',
      ...(type === 'HUMAN_TASK' && { credentials: [] }),
    })
  }

  const onSubmit = (data: typeof StepRequest._type) => {
    const newStep = {
      id: `${Date.now()}`,
      title: data.title,
      description: data.description,
      type: data.type,
      asset: data.asset || '',
      // ...(data.type === "HUMAN_TASK" && { credentials: data.credentials || [] }),
    }

    createStep(newStep)
    setStepState('no-selection')
  }

  return {
    stepType,
    handleTypeSelection,
    stepForm,
    onSubmit,
  }
}

// forms
export const useCreatePresentationForm = () => {
  const [stepType, setStepType] = useState<typeof ScenarioTypeEnum._type | null>(null)

  const form = useForm<ScenarioRequestType>({
    resolver: zodResolver(ScenarioRequest),
  })

  const handleTypeSelection = (type: typeof ScenarioTypeEnum._type) => {
    setStepType(type)
    form.reset({
      name: '',
      description: '',
      type: type,
      steps: [],
      personas: [],
      hidden: false,
      issuer: '',
    })
  }

  const onSubmit = (data: ScenarioRequestType) => {
    console.log(data)
  }

  return {
    stepType,
    handleTypeSelection,
    form,
    onSubmit,
  }
}

const staleTime = 1000 * 60 * 5

export const useCreatePresentation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ScenarioRequestType) => {
      const response = await apiClient.post('/scenarios/presentations', data)
      return response
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: ['presentationScenario'] })
    },
  })
}

export const usePresentation = (slug: string) => {
  return useQuery({
    queryKey: ['presentationScenario', slug],
    queryFn: async () => {
      const response = (await apiClient.get(
        `/scenarios/presentations/${slug}`,
      )) as typeof PresentationScenarioResponse._type
      return response
    },
    staleTime,
  })
}

// STEPS
export const usePresentationStep = (slug: string) => {
  return useQuery({
    queryKey: ['presentationStep', slug],
    queryFn: async () => {
      const response = (await apiClient.get(`/scenarios/presentations/${slug}/steps`)) as typeof StepResponse._type
      return response
    },
    staleTime,
  })
}

export const useCreatePresentationStep = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ slug, data }: { slug: string; data: typeof StepRequest._type }) => {
      const response = await apiClient.post(`/scenarios/presentations/${slug}/steps`, data)
      return response
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: ['presentationStep'] })
    },
  })
}

export const useUpdatePresentationStep = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      slug,
      stepSlug,
      data,
    }: {
      slug: string
      stepSlug: string
      data: typeof StepRequest._type
    }) => {
      const response = await apiClient.put(`/scenarios/presentations/${slug}/steps/${stepSlug}`, data)
      return response
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: ['issuanceStep'] })
    },
  })
}
