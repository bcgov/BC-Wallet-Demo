import type { IntroductionStep, ProgressBarStep } from '../types'

/**
 * Updates the progress bar array for a given screen.
 * Handles three cases: delete (if updatedProgressBar is null), add, or update.
 * When adding, maintains proper ordering based on screen positions.
 */
export const updateProgressBarForScreen = (
  currentProgressBars: ProgressBarStep[],
  updatedProgressBar: ProgressBarStep | null | undefined,
  savedScreen: IntroductionStep,
  updatedItems: IntroductionStep[],
): ProgressBarStep[] => {
  if (updatedProgressBar === undefined || !savedScreen.screenId) {
    return currentProgressBars
  }

  const updatedProgressBars = [...currentProgressBars]
  const existingIndex = updatedProgressBars.findIndex((pb) => pb.introductionStep === savedScreen.screenId)

  if (updatedProgressBar === null) {
    // Delete the progress bar
    if (existingIndex !== -1) {
      updatedProgressBars.splice(existingIndex, 1)
    }
  } else {
    // Add or update the progress bar
    const progressBarWithCorrectId = {
      ...updatedProgressBar,
      introductionStep: savedScreen.screenId,
    }

    if (existingIndex !== -1) {
      // Update existing progress bar
      updatedProgressBars[existingIndex] = {
        ...updatedProgressBars[existingIndex],
        iconLight: progressBarWithCorrectId.iconLight,
        iconDark: progressBarWithCorrectId.iconDark,
      }
    } else {
      // Add new progress bar
      updatedProgressBars.push(progressBarWithCorrectId)
    }
  }

  // Reorder progress bars to match introduction screen order
  updatedProgressBars.sort((a, b) => {
    const aScreenIndex = updatedItems.findIndex((screen) => screen.screenId === a.introductionStep)
    const bScreenIndex = updatedItems.findIndex((screen) => screen.screenId === b.introductionStep)
    return aScreenIndex - bScreenIndex
  })

  return updatedProgressBars
}
