import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { WritableDraft } from "immer";
import type { Credential } from "@/openapi-types";

type Mode = "create" | "import" | "view";

interface State {
	selectedCredential: Credential | null;
	mode: Mode;
	isCreating: boolean;
	isDeleting: boolean;
	credentials: Credential[];
}

interface Actions {
	setSelectedCredential: (credential: Credential | null) => void;
	startCreating: () => Promise<string>;
	startImporting: () => void;
	viewCredential: (credential: Credential) => void;
	cancel: () => void;
	reset: () => void;
	deleteCredential: (credentialId: string) => void;
}

export const useCredentials = create<State & Actions>()(
	immer((set, get) => ({
		selectedCredential: null,
		mode: "create",
		credentials: [],
		isCreating: false,
		isDeleting: false,

		deleteCredential: (credentialId: string) => {
			set((state) => {
				state.isDeleting = true;
			});

			set((state) => {
				state.credentials = state.credentials.filter(
					(credential) => credential.id !== credentialId
				);
				state.selectedCredential = null;
				state.mode = "create";
				state.isDeleting = false;
			});
		},

		setSelectedCredential: (credential) =>
			set((state) => {
				state.selectedCredential = credential;
			}),

		startCreating: async () => {
			const newCredential = {
				id: Date.now().toString(),
				name: "",
				version: "",
				type: "ANONCRED",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				credentialSchema: {
					id: "",
					name: "",
					version: "",
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			} as WritableDraft<Credential>;

			set((state) => {
				state.selectedCredential = newCredential;
				state.isCreating = true;
				state.mode = "create";
			});

			return newCredential.id;
		},

		startImporting: () =>
			set((state) => {
				state.mode = "import";
				state.isCreating = false;
				state.selectedCredential = null;
			}),

		viewCredential: (credential) => {
			set((state) => {
				state.selectedCredential = credential;
				state.mode = "view";
				state.isCreating = false;
			});
		},

		cancel: () => {
			set((state) => {
				state.selectedCredential = null;
				state.isCreating = false;
				state.mode = "create";
			});
		},

		reset: () =>
			set((state) => {
				state.selectedCredential = null;
				state.mode = "create";
				state.isCreating = false;
			}),
	}))
);
