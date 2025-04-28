'use client'

import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import apiClient from "@/lib/apiService";
import type { ShowcaseRequest, ShowcasesResponse, Showcase, ShowcaseResponse } from "bc-wallet-openapi";

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

export const useShowcase = (slug: string): UseQueryResult<Showcase> => {
  return useQuery({
    queryKey: ['showcase', slug],
    queryFn: async () => {
      const response = await apiClient.get(`/showcases/${slug}`) as Showcase;
      return response;
    },
    staleTime,
  });
}

export const useUpdateShowcase = (slug: string): UseMutationResult<Showcase, Error, ShowcaseRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ShowcaseRequest): Promise<Showcase> => {
      if (!slug) {
        throw new Error("Showcase slug is required");
      }
      const response = await apiClient.put(`/showcases/${slug}`, data);
      return response as Showcase;
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
      return response as ShowcaseResponse;
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