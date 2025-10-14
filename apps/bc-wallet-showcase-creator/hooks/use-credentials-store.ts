import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { CredentialDefinition, JobStatus } from "bc-wallet-openapi";

type Mode = "create" | "import" | "view";

interface State {
	selectedCredential: CredentialDefinition | null;
	mode: Mode;
	isCreating: boolean;
	isDeleting: boolean;
	credentials: CredentialDefinition[];
	selectedJobStatus: JobStatus | null;
}

interface Actions {
	setSelectedCredential: (credential: CredentialDefinition | null) => void;
	setSelectedJobStatus: (job: JobStatus | null) => void;
	startCreating: () => Promise<string>;
	startImporting: () => void;
	viewCredential: (credential: CredentialDefinition) => void;
	viewCredentialRequest: (credential: JobStatus) => void;
	cancel: () => void;
	reset: () => void;
	deleteCredential: (credentialId: string) => void;
}

export const useCredentials = create<State & Actions>()(
	immer((set, get) => ({
		selectedCredential: null,
		selectedJobStatus: null,
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


		setSelectedJobStatus: (job) =>
			set((state) => {
				state.selectedJobStatus = job;
			}),

		startCreating: async () => {
			const newCredential: CredentialDefinition = {
				id: Date.now().toString(),
				name: "",
				version: "",
				type: "ANONCRED",
				icon: undefined,
				createdAt: new Date(),
				updatedAt: new Date(),
				credentialSchema: {
					id: Date.now().toString(),
					name: "",
					version: "",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				tenantId: "",
			}

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

		viewCredentialRequest: (credential) => {
			set((state) => {
				state.selectedJobStatus = credential;
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
