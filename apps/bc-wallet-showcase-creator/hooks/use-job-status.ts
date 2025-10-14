import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/lib/apiService'
import type { JobStatusResponse } from 'bc-wallet-openapi'

const staleTime = 1000 * 60 * 5 // 5 minutes

export const useJobStatus = (entityType: string, status: string, enabledPolling: boolean = false) => {
  return useQuery<JobStatusResponse>({
    queryKey: ['jobStatus', entityType, status],
    queryFn: async () => {
      const response = await apiClient.get('/job-status/entity/' + entityType + '/' + status)
      return response as JobStatusResponse
    },
    staleTime
  })
}

export const useExecutePendingJob = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ jobIds, tenantId }: { jobIds: string; tenantId?: string }) => {
      const response = await apiClient.post('/job-status/entity/pending/' + jobIds, { tenantId })
      return response
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['credentialDefinitions'] })
      queryClient.invalidateQueries({ queryKey: ['jobStatus', 'credentialSchema', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['jobStatus', 'credentialDefinition', 'pending'] })
    },
  })
}


export const useUpdateJobStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status, tenantId }: { id: string; status: string; tenantId?: string }) => {
      const response = await apiClient.patch('/job-status/' + id, { status, tenantId })
      return response as JobStatusResponse
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['credentialDefinitions'] })
      queryClient.invalidateQueries({ queryKey: ['jobStatus', 'credentialSchema', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['jobStatus', 'credentialDefinition', 'pending'] })
    },
  })
}
