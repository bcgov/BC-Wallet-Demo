import type { ScenarioScreen } from '../types'

export interface ScenarioRow {
  idx: number
  screen: ScenarioScreen
  nextScreen?: ScenarioScreen
  hasProofChild: boolean
  isPredefinedScreen: boolean
}

/**
 * Preprocesses scenario screens into renderable rows.
 * Handles PROOF/CONNECTION pairing and computes all necessary state upfront.
 */
export function buildScenarioRows(screens: ScenarioScreen[]): ScenarioRow[] {
  const rows: ScenarioRow[] = []
  const processedIndices = new Set<number>()

  for (let idx = 0; idx < screens.length; idx++) {
    if (processedIndices.has(idx)) continue

    const screen = screens[idx]

    // Skip PROOF screens as they're rendered within CONNECTION blocks
    const prevScreen = idx > 0 ? screens[idx - 1] : null
    if (screen.screenId === 'PROOF' && prevScreen?.screenId === 'CONNECTION') {
      processedIndices.add(idx)
      continue
    }

    // Check if this CONNECTION screen has a PROOF child
    const nextScreen = idx + 1 < screens.length ? screens[idx + 1] : undefined
    const hasProofChild = screen.screenId === 'CONNECTION' && nextScreen?.screenId === 'PROOF'

    // Check if screen is a predefined system screen (not draggable)
    const isPredefinedScreen =
      screen.screenId === 'START' ||
      screen.screenId === 'CONNECTION' ||
      screen.screenId === 'PROOF' ||
      screen.screenId === 'STEP_END'

    rows.push({
      idx,
      screen,
      nextScreen,
      hasProofChild,
      isPredefinedScreen,
    })

    processedIndices.add(idx)
  }

  return rows
}
