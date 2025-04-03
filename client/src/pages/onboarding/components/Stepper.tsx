import type { CustomCharacter } from '../../../slices/types'

import { motion } from 'framer-motion'
import React from 'react'

import { topDown } from '../../../FramerAnimations'

import { StepperItem } from './StepperItem'

export interface Props {
  onboardingStep: string
  currentCharacter?: CustomCharacter
}

export const Stepper: React.FC<Props> = ({ currentCharacter, onboardingStep }) => {
  const renderSteps = currentCharacter?.progressBar?.map((item) => {
    return <StepperItem key={item.name} item={item} currentStep={onboardingStep} currentCharacter={currentCharacter} />
  })

  return (
    <motion.div
      variants={topDown}
      initial="hidden"
      animate="show"
      exit="exit"
      className="mb-4 w-full lg:w-2/3 sxl:w-1/2 select-none"
    >
      <div className="mx-2 p-2 md:mx-4 md:p-4">
        <div className="flex items-center">
          {renderSteps && (
            <>
              <div className="flex w-8 md:w-16 border-t-4 transition duration-500 ease-in-out border-bcgov-blue dark:border-bcgov-gold rounded-l-lg" />
              {renderSteps}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
