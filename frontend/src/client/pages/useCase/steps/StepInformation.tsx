import type { ScenarioScreen } from '../../../slices/types'

import { motion } from 'framer-motion'
import React from 'react'

import { fadeX } from '../../../FramerAnimations'
import { prependApiUrl } from '../../../utils/Url'
import { StepInfo } from '../components/StepInfo'

export interface Props {
  step: ScenarioScreen
}

export const StepInformation: React.FC<Props> = ({ step }) => {
  return (
    <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit" className="flex flex-col h-full">
      <StepInfo title={step.name} description={step.text} />
      <div className="flex m-auto">
        <img className="object-contain m-auto w-5/6" src={step.image && prependApiUrl(step.image)} alt={step.name} />
      </div>
    </motion.div>
  )
}
