import React from 'react'

import { useDarkMode } from '../../../hooks/useDarkMode'
import type { Step } from '../../../slices/types'

export interface Props {
  step: Step
  currentStep: number
  maxSteps: number
}

export const StepperItem: React.FC<Props> = ({ step, currentStep, maxSteps }) => {
  const currentStepIsEqual = currentStep === step.order
  const currentStepIsNotEqual = currentStep !== step.order
  const currentStepIsHigher = currentStep > step.order
  const currentStepIsLower = currentStep < step.order

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
          <div className={`flex items-center justify-center h-full text-bcgov-blue dark:text-bcgov-gold`}>
            {step.order}
          </div>
        </div>
      </div>
      {step.order !== maxSteps && (
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
