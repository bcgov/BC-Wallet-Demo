'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiService";
import type { TenantsResponse, TenantResponse, TenantRequest } from "bc-wallet-openapi";

const staleTime = 1000 * 60 * 5;

export function useTenants() {
  return useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = (await apiClient.get(
        "/tenants"
      )) as TenantsResponse;
      return response;
    },
    staleTime,
  });
}

export const useTenant = (id: string) => {
  return useQuery({
    queryKey: ["tenant", id],
    queryFn: async () => {
      const response = (await apiClient.get(
        `/tenants/${id}`
      )) as TenantResponse;
      return response;
    },
    staleTime,
  });
}
