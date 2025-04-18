import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiService';

export const useDeleteStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ issuanceScenarioSlug, stepId }: {issuanceScenarioSlug: string, stepId: string}) => {
      await apiClient.delete(
        `/scenarios/issuances/${issuanceScenarioSlug}/steps/${stepId}`
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['steps'] });
    },
  });
};