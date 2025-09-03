import { useQuery } from "@tanstack/react-query"

import apiClient from "@/lib/apiService"
import type { JobStatusResponse } from "bc-wallet-openapi"

const staleTime = 1000 * 60 * 5 // 5 minutes

export const useJobStatus = (entityType: string, status: string) => {
  return useQuery<JobStatusResponse>({
    queryKey: ['jobStatus', entityType, status],
     queryFn: async () => {
      const response = await apiClient.get('/job-status/entity/' + entityType + '/' + status)
      return response as JobStatusResponse
    },
    staleTime
  })
}

export const executePendingJob = async (jobIds: string, tenantId?: string) => {
  const response = await apiClient.post('/job-status/entity/pending/' + jobIds, { tenantId });
  return response;
};