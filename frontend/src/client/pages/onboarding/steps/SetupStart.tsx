import { motion } from 'framer-motion'
import React from 'react'

import { fadeX } from '../../../FramerAnimations'
import { StepInformation } from '../components/StepInformation'

export interface Props {
  title: string
  text: string
}

export const SetupStart: React.FC<Props> = ({ title, text }) => {
  return (
    <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit">
      <StepInformation title={title} text={text} />
    </motion.div>
  )
}
