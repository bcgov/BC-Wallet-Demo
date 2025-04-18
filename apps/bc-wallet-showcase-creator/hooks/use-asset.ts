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
  return useQuery({
    queryKey: ['assets', id],
    queryFn: () => apiClient.get(`/assets/${id}`),
    enabled: !!id, // Only fetch if id is valid
    refetchOnWindowFocus: true, // Fetch when window is focused
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
