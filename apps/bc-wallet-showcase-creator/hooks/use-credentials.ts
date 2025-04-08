import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiService";
import type {
	CredentialDefinitionRequest,
	IssuersResponse,
	IssuerResponse,
	CredentialDefinitionsResponse,
	CredentialSchemaRequest,
	IssuerRequest,
	RelyingPartyResponse,
	RelyingPartyRequest,
} from "@/openapi-types";

const staleTime = 1000 * 60 * 5; // 5 minutes

export function useCredentialDefinitions() {
	return useQuery({
		queryKey: ["credential"],
		queryFn: async () => {
			const response = (await apiClient.get(
				"/credentials/definitions"
			)) as typeof CredentialDefinitionsResponse._type;
			return response;
		},
		staleTime,
	});
}

export const useCredentialDefinition = (slug: string) => {
	return useQuery({
		queryKey: ["credential", slug],
		queryFn: async () => {
			const response = (await apiClient.get(
				`/credential/definitions/${slug}`
			)) as typeof CredentialDefinitionsResponse._type;
			return response;
		},
		staleTime,
	});
};

export const useIssuersQuery = () => {
	return useQuery({
		queryKey: ["issuers"],
		queryFn: async () => {
			const response = await apiClient.get<{ issuers: typeof IssuersResponse }>(
				"/roles/issuers"
			);
			if (!response) {
				throw new Error("Failed to fetch issuers");
			}
			return response.issuers;
		},
		staleTime,
	});
};

export const useIssuerQuery = (issuerId: string) => {
	return useQuery({
		queryKey: ["issuer", issuerId],
		queryFn: async () => {
			if (!issuerId) throw new Error("Issuer ID is required");

			const response = await apiClient.get<{ issuer: typeof IssuerResponse }>(
				`/roles/issuers/${issuerId}`
			);
			if (!response) {
				throw new Error("Failed to fetch issuer");
			}
			return response.issuer;
		},
		enabled: !!issuerId,
		staleTime,
	});
};

export const useCreateCredentialSchema = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: typeof CredentialSchemaRequest._type) => { 
			const response = await apiClient.post(`/credentials/schemas`, data);
			return response;
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["credentialSchema"] });
		},
	});
};

export const useCreateCredentialDefinition = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: typeof CredentialDefinitionRequest._type) => {
			const response = await apiClient.post(`/credentials/definitions`, data);
			return response;
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["credential"] });
		},
	});
};

export const useDeleteCredentialDefinition = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (slug: string) => {
			const response = await apiClient.delete(
				`/credentials/definitions/${slug}`
			);
			return response;
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["credential"] });
		},
	});
};

export const useCreateIssuer = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: typeof IssuerRequest._type) => {
			const response = await apiClient.post(`/roles/issuers`, data);
			return response;
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["issuer"] });
		},

	});
};

export const useRelyingPartyQuery = () => {
	return useQuery({
		queryKey: ["relying-parties"],
		queryFn: async () => {
			const response = await apiClient.get<{ relayer: typeof RelyingPartyResponse }>(
				"/roles/relying-parties"
			);
			return response;
		},
		staleTime,
	});
};

export const useCreateRelyingParty = () => {
	const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: typeof RelyingPartyRequest._type) => {
      const response = await apiClient.post(`/roles/relying-parties`, data);
      return response;
    },
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["issuer"] });
		},
  });
};