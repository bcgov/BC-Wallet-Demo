import type { IntroductionStep, ProgressBarStep } from '../types'

export interface IntroductionRow {
  type: 'single' | 'pair'
  idx: number
  screen: IntroductionStep
  nextScreen?: IntroductionStep
  progressStep?: ProgressBarStep
  acceptProgressStep?: ProgressBarStep
  isFirstConnectScreen: boolean
}

/**
 * Preprocesses introduction screens into renderable rows.
 * Handles CONNECT/ACCEPT pairing and computes all necessary state upfront.
 */
export function buildIntroductionRows(
  introduction: IntroductionStep[],
  progressBar: ProgressBarStep[] = [],
): IntroductionRow[] {
  const rows: IntroductionRow[] = []
  const processedIndices = new Set<number>()

  for (let idx = 0; idx < introduction.length; idx++) {
    if (processedIndices.has(idx)) continue

    const screen = introduction[idx]

    // Skip ACCEPT screens in main loop - they're processed as part of CONNECT pairs
    if (screen.screenId.startsWith('ACCEPT')) {
      processedIndices.add(idx)
      continue
    }

    const progressStep = progressBar?.find((p) => p.introductionStep === screen.screenId)
    const isConnectScreen = screen.screenId.startsWith('CONNECT')
    const nextScreen = introduction[idx + 1]
    const hasAcceptChild = nextScreen && nextScreen.screenId.startsWith('ACCEPT')
    const acceptProgressStep = hasAcceptChild
      ? progressBar?.find((p) => p.introductionStep === nextScreen.screenId)
      : undefined
    const isFirstConnectScreen =
      isConnectScreen && introduction.findIndex((s) => s.screenId.startsWith('CONNECT')) === idx

    if (isConnectScreen && hasAcceptChild) {
      // This is a CONNECT/ACCEPT pair - render as single row
      rows.push({
        type: 'pair',
        idx,
        screen,
        nextScreen,
        progressStep,
        acceptProgressStep,
        isFirstConnectScreen,
      })
      processedIndices.add(idx)
      processedIndices.add(idx + 1)
    } else {
      // Single screen
      rows.push({
        type: 'single',
        idx,
        screen,
        progressStep,
        isFirstConnectScreen,
      })
      processedIndices.add(idx)
    }
  }

  return rows
}
