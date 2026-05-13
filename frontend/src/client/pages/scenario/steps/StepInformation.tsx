import type { ScenarioScreen } from '../../../slices/types'

import { motion } from 'framer-motion'
import React from 'react'

import { fadeX } from '../../../FramerAnimations'
import { baseUrl } from '../../../api/BaseUrl'
import { StepInfo } from '../components/StepInfo'

export interface Props {
  step: ScenarioScreen
}

export const StepInformation: React.FC<Props> = ({ step }) => {
  return (
    <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit" className="flex flex-col h-full gap-4">
      <div className="flex-shrink-0">
        <StepInfo title={step.name} description={step.text} />
      </div>

      {step.image && (
        <div
          className="bg-contain bg-center bg-no-repeat h-full flex items-center justify-center"
          style={{ backgroundImage: `url(${baseUrl}${step.image})` }}
        />
      )}
    </motion.div>
  )
}
