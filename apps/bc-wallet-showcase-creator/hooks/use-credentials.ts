'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/apiService'
import type {
  IssuersResponse,
  IssuerRequest,
  CredentialSchemaRequest,
  IssuerResponse,
  RelyingPartyResponse,
  RelyingPartyRequest,
  CredentialDefinitionResponse,
  CredentialDefinitionRequest,
  CredentialDefinitionsResponse,
	CredentialSchemaResponse,
  CredentialSchemaImportRequest,
  CredentialDefinitionImportRequest,
} from 'bc-wallet-openapi'

const staleTime = 1000 * 60 * 5 // 5 minutes

export const useCredentialDefinitions = () => {
  return useQuery<CredentialDefinitionsResponse>({
    queryKey: ['credentialDefinitions'],
    queryFn: async () => {
      const response = await apiClient.get('/credentials/definitions')
      return response as CredentialDefinitionsResponse
    },
    staleTime
  })
}

export const useCredentialDefinition = (definitionId: string) => {
  return useQuery<CredentialDefinitionResponse>({
    queryKey: ['credentialDefinition', definitionId],
    queryFn: async () => {
      const response = await apiClient.get(`/credentials/definitions/${definitionId}`)
      return response as CredentialDefinitionResponse
    },
    staleTime,
    enabled: !!definitionId
  })
}

export const useIssuersQuery = () => {
  return useQuery({
    queryKey: ['issuers'],
    queryFn: async () => {
      const response = await apiClient.get<{ issuers: IssuersResponse }>('/roles/issuers')
      if (!response) {
        throw new Error('Failed to fetch issuers')
      }
      return response.issuers
    },
    staleTime,
  })
}

export const useIssuerQuery = (issuerId: string) => {
  return useQuery({
    queryKey: ['issuer', issuerId],
    queryFn: async () => {
      if (!issuerId) throw new Error('Issuer ID is required')

      const response = await apiClient.get<{ issuer: IssuerResponse }>(`/roles/issuers/${issuerId}`)
      if (!response) {
        throw new Error('Failed to fetch issuer')
      }
      return response.issuer
    },
    enabled: !!issuerId,
    staleTime,
  })
}

export const useCreateCredentialSchema = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CredentialSchemaRequest) => {
      const response = await apiClient.post(`/credentials/schemas`, data)
      return response as CredentialSchemaResponse
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['credentialSchema'] })
    },
  })
}

export const useImportCredentialSchema = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CredentialSchemaImportRequest) => {
      const response = await apiClient.post(`/credentials/schemas/import`, data)
      return response;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['credentialSchema'] })
    }
  })
}

export const useImportCredentialDefinition = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CredentialDefinitionImportRequest) => {
      const response = await apiClient.post(`/credentials/definitions/import`, data)
      return response;
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['credential'] })
      }, 10000);
    }
  })
}

export const useUpdateCredentialSchema = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ credentialSchemaId, data }: { credentialSchemaId: string; data: CredentialSchemaRequest }) => {
      const response = await apiClient.put(`/credentials/schemas/${credentialSchemaId}`, data)
      return response as CredentialSchemaResponse
    },
    onSuccess: (_, { credentialSchemaId }) => {
      queryClient.invalidateQueries({ queryKey: ['credentialSchema', credentialSchemaId] })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['credentialSchema'] })
    }
  })
}

export const useCreateCredentialDefinition = () => {
  const queryClient = useQueryClient()
  
  return useMutation<CredentialDefinitionResponse, Error, CredentialDefinitionRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post('/credentials/definitions', data)
      return response as CredentialDefinitionResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentialDefinitions'] })
    }
  })
}

export const useUpdateCredentialDefinition = () => {
  const queryClient = useQueryClient()
  
  return useMutation<
    CredentialDefinitionResponse, 
    Error, 
    { id: string; data: CredentialDefinitionRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put(`/credentials/definitions/${id}`, data)
      return response as CredentialDefinitionResponse
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['credentialDefinitions'] })
      queryClient.invalidateQueries({ queryKey: ['credentialDefinition', variables.id] })
    }
  })
}

export const useApproveCredentialDefinition = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentialId: string) => {
      const response = await apiClient.post(`/credentials/definitions/${credentialId}/approve`)
      return response as CredentialDefinitionResponse
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['credentialDefinitions'] })
    },
  })
}

export const useDeleteCredentialDefinition = () => {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/credentials/definitions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentialDefinitions'] })
    }
  })
}

export const useCreateIssuer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: IssuerRequest) => {
      const response = await apiClient.post(`/roles/issuers`, data)
      return response as IssuerResponse
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['issuer'] })
    },
  })
}

export const useUpdateIssuer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: IssuerRequest }) => {
      const response = await apiClient.put(`/roles/issuers/${id}`, data)
      return response as IssuerResponse
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['issuer'] })
    },
  })
}

export const useRelyingPartyQuery = () => {
  return useQuery({
    queryKey: ['relying-parties'],
    queryFn: async () => {
      const response = await apiClient.get<{ relayer: RelyingPartyResponse }>('/roles/relying-parties')
      return response
    },
    staleTime,
  })
}

export const useCreateRelyingParty = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: RelyingPartyRequest) => {
      const response = await apiClient.post(`/roles/relying-parties`, data)
      return response as RelyingPartyResponse
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['issuer'] })
    },
  })
}
