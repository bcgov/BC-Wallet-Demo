import type { Showcase, IntroductionStep, ScenarioScreen } from '../types'
import type { AuthContextProps } from 'react-oidc-context'

import { updateShowcase } from '../api/adminApi'

import { toSnakeCase } from './formatters'

type Screen = IntroductionStep | ScenarioScreen

interface SaveScreenParams {
  showcase: Showcase
  auth: AuthContextProps
  updatedScreen: Screen
  editingScreenIdx: number | null
  insertionIdx: number | null
  screenType: 'introduction' | 'scenarios'
  activeScenarioId?: string
  onRefresh?: () => void | Promise<void>
  currentItems?: Screen[]
}

/**
 * Shared logic for saving screens in both IntroductionTab and ScenariosTab
 * Handles screen insertion, updating, snake_case conversion, and API persistence
 */
export async function saveScreenToShowcase({
  showcase,
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
  let updates: Partial<Showcase>

  if (screenType === 'introduction') {
    updates = { introduction: updatedItems as IntroductionStep[] }
  } else {
    // scenarios
    const updatedScenarios = showcase.scenarios?.map((sc) => {
      if (sc.id === activeScenarioId) {
        return { ...sc, screens: updatedItems as ScenarioScreen[] }
      }
      return sc
    })
    updates = { scenarios: updatedScenarios }
  }

  // Call API to persist the changes
  await updateShowcase(auth, showcase.name, updates)

  // Refetch character data to ensure UI is in sync
  if (onRefresh) {
    await Promise.resolve(onRefresh())
  }

  return { updatedItems }
}
