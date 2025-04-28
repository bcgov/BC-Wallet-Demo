import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import apiClient from "@/lib/apiService";
import { IssuanceScenarioRequest, IssuanceScenarioResponse, StepResponse } from "bc-wallet-openapi";

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
      )) as IssuanceScenarioResponse;
      return response;
    },
    staleTime,
  });
};

export const useIssuanceStep = (slug: string): UseQueryResult<StepResponse> => {
  return useQuery({
    queryKey: ["issuanceStep", slug],
    queryFn: async (): Promise<StepResponse> => {
      const response = (await apiClient.get(
        `/scenarios/issuances/${slug}/steps`
      )) as StepResponse;
      return response;
    },
    staleTime,
  });
};
