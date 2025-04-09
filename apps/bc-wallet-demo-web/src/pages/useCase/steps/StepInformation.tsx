import React, { FC } from 'react'
import { motion } from 'framer-motion'
import { fadeX } from '../../../FramerAnimations'
import { prependApiUrl } from '../../../utils/Url'
import { StepInfo } from '../components/StepInfo'
import type { Step } from '../../../slices/types'
import {showcaseServerBaseUrl} from '../../../api/BaseUrl';

export interface Props {
  step: Step
}

export const StepInformation: FC<Props> = ({ step }) => {
  return (
    <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit" className="flex flex-col h-full">
      <StepInfo title={step.title} description={step.description} />
      { step.asset &&
          <div className="flex m-auto">
              <img className="object-contain m-auto w-5/6" src={`${showcaseServerBaseUrl}/assets/${step.asset}/file`} alt={step.title} />
          </div>
      }
    </motion.div>
  )
}
