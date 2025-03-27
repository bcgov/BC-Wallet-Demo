import type { Dispatch } from 'react'

import { track } from 'insights-js'

import { setOnboardingStep } from '../slices/onboarding/onboardingSlice'
import type { Step } from '../slices/types'

export const setOnboardingProgress = (dispatch: Dispatch<any>, step: Step): void => {
  dispatch(setOnboardingStep(step))
  track({
    id: 'onboarding-step-completed',
    parameters: {
      step: JSON.stringify(step),
    },
  })
}
