import { create } from "zustand";
import { persist } from "zustand/middleware";


// this is a temporaty store for the helpers
// issuer id and cred definition will be part of the credentials
// this store will be removed when the credentials are part of the showcase
interface HelpersStore {
  selectedCredentialDefinitionIds: string[];
  issuerId: string;
  relayerId: string;
  tenantId: string;
  setSelectedCredentialDefinitionIds: (ids: string[]) => void;
  setIssuerId: (issuerId: string) => void;
  setRelayerId: (relayerId: string) => void;
  setTenantId: (tenantId: string) => void;
  reset: () => void;
}

const initialState = {
  issuerId: "",
  relayerId: "",
  selectedCredentialDefinitionIds: [] as string[],
  tenantId: "",
};

export const useHelpersStore = create<HelpersStore>()(
  persist(
    (set) => ({
      ...initialState,
      setSelectedCredentialDefinitionIds: (selectedCredentialDefinitionIds) => set({ selectedCredentialDefinitionIds }),
      setIssuerId: (issuerId: string) => set({ issuerId }),
      setRelayerId: (relayerId: string) => set({ relayerId }),
      setTenantId: (tenantId: string) => set({ tenantId }),
      reset: () => set(initialState),
    }),
    {
      name: 'helpers-store',
    }
  )
);