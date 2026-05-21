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
        <img src={`${baseUrl}${step.image}`} alt={step.name} className="max-h-full max-w-full object-contain" />
      )}
    </motion.div>
  )
}
