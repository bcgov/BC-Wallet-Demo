'use client'

import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import apiClient from '@/lib/apiService'
import {
  type ShowcaseRequest,
  type ShowcasesResponse,
  type ShowcaseResponse,
} from 'bc-wallet-openapi'
import { debugLog, showcaseToShowcaseRequest } from '@/lib/utils'

const staleTime = 1000 * 60 * 5

export function useShowcases() {
  return useQuery({
    queryKey: ['showcases'],
    queryFn: async () => {
      const response = (await apiClient.get('/showcases')) as ShowcasesResponse
      return response
    },
    staleTime,
  })
}

export const useShowcase = (slug: string): UseQueryResult<ShowcaseResponse> => {
  return useQuery({
    queryKey: ['showcase', slug],
    queryFn: async () => {
      const response = await apiClient.get(`/showcases/${slug}`)
      return response as ShowcaseResponse
    },
    staleTime,
  })
}

export const useUpdateShowcase = (slug: string): UseMutationResult<ShowcaseResponse, Error, ShowcaseRequest> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: ShowcaseRequest): Promise<ShowcaseResponse> => {
      if (!slug) {
        throw new Error('Showcase slug is required')
      }
      const response = await apiClient.put(`/showcases/${slug}`, data)
      return response as ShowcaseResponse
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['showcase', slug] })
      queryClient.invalidateQueries({ queryKey: ['showcases'] })
    },
  })
}

export const useCreateShowcase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ShowcaseRequest) => {
      const response = await apiClient.post(`/showcases`, data)
      return response as ShowcaseResponse
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['showcases'] })
    },
  })
}

export const useDeleteShowcase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (slug: string) => {
      const response = await apiClient.delete(`/showcases/${slug}`)
      return response
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['showcases'] })
    },
  })
}

interface UpdateShowcaseScenariosParams {
  showcaseSlug: string
  scenarioIds: string[]
}

export const useUpdateShowcaseScenarios = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ showcaseSlug, scenarioIds }: UpdateShowcaseScenariosParams) => {
      if (!showcaseSlug) {
        throw new Error('Showcase slug is required')
      }

      const response = await apiClient.get(`/showcases/${showcaseSlug}`)
      const showcaseResponse = response as ShowcaseResponse
      const showcase = showcaseResponse.showcase

      if (!showcase) {
        throw new Error('Showcase not found')
      }

      const existingScenarioIds = showcase?.scenarios?.map((s) => s.id) || []

      const allScenarioIds = Array.from(new Set([...existingScenarioIds, ...scenarioIds]))

      const parsed = showcaseToShowcaseRequest(showcase)

      const updateData = {
        ...parsed,
        scenarios: allScenarioIds,
      }

      const updateResponse = await apiClient.put(`/showcases/${showcaseSlug}`, updateData)
      return updateResponse as ShowcaseResponse
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['showcase', variables.showcaseSlug] })
    },
    onError: (error) => {
      console.error('Error updating showcase scenarios:', error)
    },
  })
}
