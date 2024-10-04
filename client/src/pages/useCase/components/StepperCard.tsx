import type { UseCaseScreen } from '../../../slices/types'

import { motion } from 'framer-motion'
import React from 'react'

export interface Props {
  steps: UseCaseScreen[]
  currentStep: string
}

export const StepperCard: React.FC<Props> = ({ steps, currentStep }) => {
  const progress = steps.filter((step) => !step.screenId.startsWith('START'))

  const stepViewItems = progress.map((item, idx) => {
    const currentStepIsEqual = item.screenId === currentStep
    const currentStepIsNotEqual = item.screenId !== currentStep

    return (
      <div className="flex flex-row" key={item.screenId}>
        <div className="flex flex-col">
          <div
            className="rounded-full h-7 w-7 p-3.5 ring-2 border-2 border-white dark:border-bcgov-darkgrey ring-bcgov-lightgrey dark:ring-bcgov-black mx-2 transition transition-all duration-300 "
            style={{ background: currentStepIsEqual ? 'rgb(146, 227, 169)' : 'rgb(201, 237, 211)' }}
          />
          {idx !== progress.length - 1 && (
            <div className="border-l-2 border-bcgov-lightgrey dark:border-bcgov-black border-rounded h-full m-auto" />
          )}
        </div>
        <div className={`flex flex-col mx-2 ${currentStepIsNotEqual && 'opacity-40'}`}>
          <h1 className="font-medium">{item.title}</h1>
          <div className="my-2 mb-6 text-xs md:text-sm"></div>
        </div>
      </div>
    )
  })

  return (
    <motion.div className="flex flex-col bg-white dark:bg-bcgov-darkgrey rounded-lg p-4 h-auto shadow mb-4">
      <div className="flex-1-1 title mb-2">
        <h1 className="font-semibold dark:text-white">Follow this path</h1>
        <hr className="text-bcgov-lightgrey" />
      </div>
      <div className="my-4">{stepViewItems}</div>
    </motion.div>
  )
}
