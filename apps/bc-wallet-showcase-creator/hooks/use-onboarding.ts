// @ts-nocheck

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useShowcaseStore } from "./use-showcase-store";
import { produce } from "immer";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  IssuanceScenarioResponse,
  ScenarioRequestType,
  ScenarioTypeEnum,
  StepRequestType,
  StepResponse,
  StepTypeEnum,
  StepType
} from "@/openapi-types";
import {
  ScenarioRequest,
  StepRequest
} from "@/openapi-types";
import apiClient from "@/lib/apiService";

type StepState =
  | "editing-basic"
  | "editing-issue"
  | "no-selection"
  | "editing-connect"
  | "editing-wallet"
  | "creating-new";

interface State {
  selectedStep: number | null;
  stepState: StepState;
  screens: StepType[];
  scenarioId: string;
  issuerId: string;
}

interface Actions {
  setSelectedStep: (index: number | null) => void;
  setStepState: (state: StepState) => void;
  initializeScreens: (screens: StepRequestType[]) => void;
  moveStep: (oldIndex: number, newIndex: number) => void;
  removeStep: (index: number) => void;
  createStep: (step: StepRequestType) => void;
  updateStep: (index: number, step: StepRequestType) => void;
  setScenarioId: (id: string) => void;
  setIssuerId: (id: string) => void;
  reset: () => void;
}

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const useOnboarding = create<State & Actions>()(
  immer((set) => ({
    selectedStep: null,
    stepState: "no-selection",
    scenarioId: "",
    issuerId: "",
    screens: [],

    setScenarioId: (id) =>
      set((state) => {
        state.scenarioId = id;
      }),

    setIssuerId: (id) =>
      set((state) => {
        state.issuerId = id;
      }),

    setSelectedStep: (index) =>
      set((state) => {
        state.selectedStep = index;
      }),

    setStepState: (newState) =>
      set((state) => {
        state.stepState = newState;
      }),

    initializeScreens: (screens) =>
      set(
        produce((state) => {
          state.screens = deepClone(screens);
        })
      ),

    moveStep: (oldIndex, newIndex) =>
      set(
        produce((state) => {
          const newScreens = [...state.screens];
          const [movedStep] = newScreens.splice(oldIndex, 1);
          newScreens.splice(newIndex, 0, movedStep);
          state.screens = newScreens;

          const { selectedCharacter } = useShowcaseStore.getState();
          useShowcaseStore.setState(
            produce((draft) => {
              draft.showcaseJSON.personas[selectedCharacter].onboarding =
                deepClone(newScreens);
            })
          );
        })
      ),

    removeStep: (index) =>
      set(
        produce((state) => {
          const newScreens = [...state.screens];
          newScreens.splice(index, 1);
          state.screens = newScreens;

          const { selectedCharacter } = useShowcaseStore.getState();
          useShowcaseStore.setState(
            produce((draft) => {
              draft.showcaseJSON.personas[selectedCharacter].onboarding =
                deepClone(newScreens);
            })
          );

          if (state.selectedStep === index) {
            state.selectedStep = null;
            state.stepState = "no-selection";
          }
        })
      ),

    createStep: (step) =>
      set((state) => {
        const newScreens = [...state.screens, step];
        state.screens = newScreens;
        state.selectedStep = newScreens.length - 1;
      
        if (step.actions?.includes("connect")) {
          state.stepState = "editing-connect";
        } else if (step.actions?.includes("wallet")) {
          state.stepState = "editing-wallet";
        } else if (step.credentials) {
          state.stepState = "editing-issue";
        } else {
          state.stepState = "editing-basic";
        }
    
        const { selectedCharacter } = useShowcaseStore.getState();
        useShowcaseStore.setState((showcaseState) => {
          showcaseState.showcaseJSON.personas[selectedCharacter].onboarding = newScreens;
        });
      }),

    updateStep: (index, step) =>
      set(
        produce((state) => {
          const newScreens = [...state.screens];
          newScreens[index] = deepClone(step);
          state.screens = newScreens;

          const { selectedCharacter } = useShowcaseStore.getState();
          useShowcaseStore.setState(
            produce((draft) => {
              draft.showcaseJSON.personas[selectedCharacter].onboarding =
                deepClone(newScreens);
            })
          );
        })
      ),

    reset: () =>
      set(
        produce((state) => {
          state.selectedStep = null;
          state.stepState = "no-selection";
          state.screens = [];
        })
      ),
  }))
);

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
