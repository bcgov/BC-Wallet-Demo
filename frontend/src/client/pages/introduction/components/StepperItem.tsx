import type { CustomCharacter, ProgressBarStep } from '../../../slices/types'

import React from 'react'

import { useDarkMode } from '../../../hooks/useDarkMode'
import { prependApiUrl } from '../../../utils/Url'

export interface Props {
  currentCharacter: CustomCharacter
  item: ProgressBarStep
  currentStep: string
}

export const StepperItem: React.FC<Props> = ({ item, currentStep, currentCharacter }) => {
  const darkMode = useDarkMode()
  const stepNames = currentCharacter.introduction.map((item) => item.screenId)
  const currentStepIsEqual = item.introductionStep === currentStep
  const currentStepIsNotEqual = item.introductionStep !== currentStep
  const currentStepIsHigher = stepNames.indexOf(currentStep) > stepNames.indexOf(item.introductionStep)
  const currentStepIsLower = stepNames.indexOf(currentStep) < stepNames.indexOf(item.introductionStep)
  return (
    <>
      <div className="flex text-grey dark:text-white relative">
        <div
          className={`rounded-full transition duration-1000 ease-in-out py-3 h-12 w-12 border-2 ${
            currentStepIsEqual
              ? 'bg-white dark:bg-bcgov-black border-2 border-bcgov-blue dark:border-bcgov-gold '
              : `${currentStepIsLower && currentStepIsNotEqual ? 'grayscale' : ''}`
          } ${
            currentStepIsHigher && currentStepIsNotEqual
              ? ' border-2 border-bcgov-blue dark:border-bcgov-gold bg-white dark:bg-bcgov-black text-white'
              : ''
          } `}
        >
          <img
            alt={item.name}
            src={darkMode ? prependApiUrl(item.iconDark) : prependApiUrl(item.iconLight)}
            className="m-auto h-5"
          />
        </div>
      </div>
      {item.introductionStep !== 'SETUP_COMPLETED' && (
        <div
          className={`flex-auto  transition duration-300 ease-in-out  ${
            currentStepIsHigher && currentStepIsNotEqual
              ? ' border-t-4 border-bcgov-blue dark:border-bcgov-gold bg-bcgov-blue dark:bg-bcgov-gold'
              : ' border-t-2 border-grey bg-grey'
          }`}
        />
      )}
    </>
  )
}
