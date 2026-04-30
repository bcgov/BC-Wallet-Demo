import type { CustomCharacter, OnboardingStep, UseCaseScreen } from '../types'
import type { AuthContextProps } from 'react-oidc-context'

import { updateCharacter } from '../api/adminApi'

import { toSnakeCase } from './toSnakeCase'

type Screen = OnboardingStep | UseCaseScreen

interface SaveScreenParams {
  character: CustomCharacter
  auth: AuthContextProps
  updatedScreen: Screen
  editingScreenIdx: number | null
  insertionIdx: number | null
  screenType: 'onboarding' | 'scenarios'
  activeScenarioId?: string
  onRefresh?: () => void | Promise<void>
  currentItems?: Screen[]
}

/**
 * Shared logic for saving screens in both IntroductionTab and ScenariosTab
 * Handles screen insertion, updating, snake_case conversion, and API persistence
 */
export async function saveScreenToCharacter({
  character,
  auth,
  updatedScreen,
  editingScreenIdx,
  insertionIdx,
  screenType,
  activeScenarioId,
  onRefresh,
  currentItems = [],
}: SaveScreenParams): Promise<{ updatedItems: Screen[] }> {
  if (!auth.user?.access_token) {
    throw new Error('No access token available')
  }

  // Convert screenId to uppercase snake case
  const screenWithFormattedId = {
    ...updatedScreen,
    screenId: updatedScreen.screenId ? toSnakeCase(updatedScreen.screenId) : '',
  }

  let updatedItems: Screen[]

  if (editingScreenIdx === -1) {
    // New screen - insert at insertionIdx
    updatedItems = [...currentItems]
    const insertPos = insertionIdx ?? currentItems.length
    updatedItems.splice(insertPos, 0, screenWithFormattedId)
  } else {
    // Existing screen - replace at index
    updatedItems = [...currentItems]
    if (editingScreenIdx !== null) updatedItems[editingScreenIdx] = screenWithFormattedId
  }

  // Prepare the update object
  let updates: Partial<CustomCharacter>

  if (screenType === 'onboarding') {
    updates = { onboarding: updatedItems as OnboardingStep[] }
  } else {
    // scenarios
    const updatedUseCases = character.useCases?.map((uc) => {
      if (uc.id === activeScenarioId) {
        return { ...uc, screens: updatedItems as UseCaseScreen[] }
      }
      return uc
    })
    updates = { useCases: updatedUseCases }
  }

  // Call API to persist the changes
  await updateCharacter(auth, character.name, updates)

  // Refetch character data to ensure UI is in sync
  if (onRefresh) {
    await Promise.resolve(onRefresh())
  }

  return { updatedItems }
}
