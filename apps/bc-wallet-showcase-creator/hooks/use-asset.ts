import apiClient from "@/lib/apiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AssetRequest, AssetResponse } from "bc-wallet-openapi";

export const useAsset = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: () => apiClient.get('/assets'),
  });
};

export const useAssetById = (id: string) => {
  if (typeof id === 'string') {
    return id;
  }

  if (typeof id === 'object' && id !== null && 'id' in id) {
    return (id as { id: string }).id;
  }

  return useQuery({
    queryKey: ['assets', id],
    queryFn: async () => {
      const response = await apiClient.get(`/assets/${id}`)
      return response as AssetResponse
    },
    enabled: !!id,
    refetchOnWindowFocus: true,
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AssetRequest) => {
      const response = await apiClient.post('/assets', data)
      return response as AssetResponse
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id}: {id: string}) => apiClient.delete(`/assets/${id}`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, data}: {id: string, data: AssetRequest}) => apiClient.put(`/assets/${id}`, data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};
