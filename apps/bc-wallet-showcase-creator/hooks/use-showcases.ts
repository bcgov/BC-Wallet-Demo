import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiService";
import type { ShowcaseResponse, ShowcaseRequest, ShowcasesResponse } from "bc-wallet-openapi";

const staleTime = 1000 * 60 * 5; // 5 minutes

export function useShowcases() {
  return useQuery({
    queryKey: ['showcases'],
    queryFn: async () => {
      const response = await apiClient.get('/showcases') as ShowcasesResponse;
      return response;
    },
    staleTime,
  });
}

export const useShowcase = (slug  : string) => {
  return useQuery({
    queryKey: ['showcase', slug],
    queryFn: async () => {
      const response = await apiClient.get(`/showcases/${slug}`) as ShowcaseResponse;
      return response;
    },
    staleTime,
  });
}

export const useUpdateShowcase = (slug: string) => {
  const queryClient = useQueryClient();
  console.log('useUpdateShowcase', slug);
  return useMutation({
    mutationFn: async (data: ShowcaseRequest) => {
      if (!slug) {
        throw new Error("Showcase slug is required");
      }
      const response = await apiClient.put(`/showcases/${slug}`, data);
      return response;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['showcases', slug] });
    }
  });
};

export const useCreateShowcase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ShowcaseRequest) => {
      const response = await apiClient.post(`/showcases`, data);
      return response;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['showcases'] });
    }
  })
}

export const useDeleteShowcase = () => {
  return useMutation({
    mutationFn: async (slug: string) => {
      const response = await apiClient.delete(`/showcases/${slug}`);
      return response;
    },
  })
}