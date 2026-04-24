import type { CustomCharacter } from '../slices/types'
import type { Dispatch } from 'react'

import { track } from 'insights-js'

import balloonDark from '../assets/dark/icon-balloon-dark.svg'
import moonDark from '../assets/dark/icon-moon-dark.svg'
import notificationDark from '../assets/dark/icon-notification-dark.svg'
import personDark from '../assets/dark/icon-person-dark.svg'
import walletDark from '../assets/dark/icon-wallet-dark.svg'
import balloonLight from '../assets/light/icon-balloon-light.svg'
import moonLight from '../assets/light/icon-moon-light.svg'
import notificationLight from '../assets/light/icon-notification-light.svg'
import personLight from '../assets/light/icon-person-light.svg'
import walletLight from '../assets/light/icon-wallet-light.svg'
import { setOnboardingStep } from '../slices/introduction/introductionSlice'

export enum Progress {
  PICK_CHARACTER = 0,
  SETUP_START,
  CHOOSE_WALLET,
  RECEIVE_IDENTITY,
  ACCEPT_CREDENTIAL,
  SETUP_COMPLETED,
}

export interface Content {
  iconLight: string
  iconDark: string
  title: string
  text: string
}

export const OnboardingComplete = (introductionStep: string): boolean => {
  return introductionStep === 'SETUP_COMPLETED'
}

export const StepperItems = [
  { name: 'person', introductionStep: Progress.PICK_CHARACTER, iconLight: personLight, iconDark: personDark },
  { name: 'moon', introductionStep: Progress.SETUP_START, iconLight: moonLight, iconDark: moonDark },
  { name: 'wallet', introductionStep: Progress.CHOOSE_WALLET, iconLight: walletLight, iconDark: walletDark },
  {
    name: 'notification',
    introductionStep: Progress.ACCEPT_CREDENTIAL,
    iconLight: notificationLight,
    iconDark: notificationDark,
  },
  { name: 'balloon', introductionStep: Progress.SETUP_COMPLETED, iconLight: balloonLight, iconDark: balloonDark },
]

export const addOnboardingProgress = (
  dispatch: Dispatch<any>,
  introductionStep: string,
  currentCharacter?: CustomCharacter,
  step?: number,
) => {
  const inc = step ?? 1
  const steps = currentCharacter?.introduction.map((screen) => screen.screenId)
  const currentIndex = steps?.indexOf(introductionStep)
  if (currentIndex !== undefined && steps && currentIndex >= 0 && currentIndex < steps.length - 1) {
    dispatch(setOnboardingStep(steps[currentIndex + inc]))
  }
  track({
    id: 'onboarding-step-completed',
    parameters: {
      step: introductionStep.toString(),
    },
  })
}

export const removeOnboardingProgress = (
  dispatch: Dispatch<any>,
  introductionStep: string,
  currentCharacter?: CustomCharacter,
) => {
  const steps = currentCharacter?.introduction.map((screen) => screen.screenId)
  const currentIndex = steps?.indexOf(introductionStep)
  if (currentIndex && steps && currentIndex > 0 && currentIndex < steps.length) {
    dispatch(setOnboardingStep(steps[currentIndex - 1]))
  }
  track({
    id: 'onboarding-step-completed',
    parameters: {
      step: introductionStep.toString(),
    },
  })
}
