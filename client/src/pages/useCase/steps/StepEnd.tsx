import type { UseCaseScreen } from '../../../slices/types'

import { motion } from 'framer-motion'
import React from 'react'

import { fadeX } from '../../../FramerAnimations'
import { prependApiUrl } from '../../../utils/Url'
import { StepInfo } from '../components/StepInfo'

export interface Props {
  step: UseCaseScreen
}

export const StepEnd: React.FC<Props> = ({ step }) => {
  return (
    <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit" className="flex flex-col h-full">
      <StepInfo title={step.title} description={step.text} />
      {step.image && <img className="h-full w-1/2 m-auto" src={prependApiUrl(step.image)} alt={step.title} />}
    </motion.div>
  )
}
