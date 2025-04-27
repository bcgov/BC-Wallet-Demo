'use client'

import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import apiClient from "@/lib/apiService";
import type { ShowcaseRequest, ShowcasesResponse, ShowcaseResponse } from "bc-wallet-openapi";

const staleTime = 1000 * 60 * 5

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

export const useShowcase = (slug: string): UseQueryResult<ShowcaseResponse> => {
  return useQuery({
    queryKey: ['showcase', slug],
    queryFn: async () => {
      const response = await apiClient.get(`/showcases/${slug}`);
      return response as ShowcaseResponse;
    },
    staleTime,
  });
}

export const useUpdateShowcase = (slug: string): UseMutationResult<ShowcaseResponse, Error, ShowcaseRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ShowcaseRequest): Promise<ShowcaseResponse> => {
      if (!slug) {
        throw new Error("Showcase slug is required");
      }
      const response = await apiClient.put(`/showcases/${slug}`, data);
      return response as ShowcaseResponse;
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