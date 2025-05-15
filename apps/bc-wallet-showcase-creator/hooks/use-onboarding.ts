import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import apiClient from "@/lib/apiService";
import { IssuanceScenarioRequest, IssuanceScenarioResponse, StepsResponse } from "bc-wallet-openapi";

export type StepState =
  | "editing-basic"
  | "editing-issue"
  | "no-selection"
  | "editing-connect"
  | "editing-wallet"
  | "creating-new";

const staleTime = 1000 * 60 * 5;

export const useCreateScenario = (): UseMutationResult<IssuanceScenarioResponse, Error, IssuanceScenarioRequest> => {
  const queryClient = useQueryClient()

  return useMutation<IssuanceScenarioResponse, Error, IssuanceScenarioRequest>({
    mutationFn: async (data: IssuanceScenarioRequest): Promise<IssuanceScenarioResponse> => {
      const response = await apiClient.post(`/scenarios/issuances`, data)
      return response as IssuanceScenarioResponse
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['issuanceScenario'] })
    },
  })
}

export const useScenario = (slug: string): UseQueryResult<IssuanceScenarioResponse> => {
  return useQuery({
    queryKey: ["issuanceScenario", slug],
    queryFn: async (): Promise<IssuanceScenarioResponse> => {
      const response = (await apiClient.get(
        `/scenarios/issuances/${slug}`
      ));
      return response as IssuanceScenarioResponse;
    },
    staleTime,
  });
};

export const useIssuanceStep = (slug: string): UseQueryResult<StepsResponse> => {
  return useQuery({
    queryKey: ["issuanceStep", slug],
    queryFn: async (): Promise<StepsResponse> => {
      const response = (await apiClient.get(
        `/scenarios/issuances/${slug}/steps`
      ));
      return response as StepsResponse;
    },
    staleTime,
  });
};

export const useUpdateScenario = (): UseMutationResult<IssuanceScenarioResponse, Error, {slug: string, data: IssuanceScenarioRequest}> => {
  const queryClient = useQueryClient()

  return useMutation<IssuanceScenarioResponse, Error, {slug: string, data: IssuanceScenarioRequest}>({
    mutationFn: async ({slug, data}: {slug: string, data: IssuanceScenarioRequest}): Promise<IssuanceScenarioResponse> => {
      const response = await apiClient.put(`/scenarios/issuances/${slug}`, data)
      return response as IssuanceScenarioResponse
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['issuanceScenario'] })
    },
  })
}