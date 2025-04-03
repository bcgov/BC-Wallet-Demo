import type { UseCaseScreen } from '../../slices/types'

import { motion } from 'framer-motion'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { FiLogOut } from 'react-icons/fi'

import { fadeDelay } from '../../FramerAnimations'

import { ConnectionCard } from './components/ConnectionCard'
import { ProofCard } from './components/ProofCard'
import { StepperCard } from './components/StepperCard'

export interface Props {
  steps: UseCaseScreen[]
  currentStep: string
  entity: { name: string; icon?: string }
  showLeaveModal(): void
}

export const SideView: React.FC<Props> = ({ steps, currentStep, entity, showLeaveModal }) => {
  const requestedCredentials = steps.find((step) => step.requestOptions?.requestedCredentials)?.requestOptions
    ?.requestedCredentials

  return (
    <motion.div
      key={'animateSideDiv'}
      variants={{
        hidden: { x: isMobile ? 0 : '-100vh', opacity: isMobile ? 0 : 1 },
        show: {
          x: 0,
          opacity: 1,
          transition: {
            duration: 0.2,
            type: 'spring',
            damping: 10,
            stiffness: 30,
          },
        },
        exit: {
          x: isMobile ? 0 : '-100vh',
          opacity: isMobile ? 1 : 0,
          transition: {
            duration: 0.5,
            when: 'afterChildren',
          },
        },
      }}
      initial="hidden"
      animate="show"
      exit="exit"
      className="flex flex-col lg:mx-6 dark:text-white w-auto lg:w-1/3"
    >
      <ConnectionCard icon={entity.icon} entity={entity.name} />
      {requestedCredentials && <ProofCard requestedItems={requestedCredentials} />}
      <StepperCard steps={steps} currentStep={currentStep} />
      <motion.button
        onClick={showLeaveModal}
        variants={fadeDelay}
        className="flex p-0 md:p-4 fixed bottom-5 lg:relative"
      >
        <FiLogOut className="ml-2 inline h-8 cursor-pointer" />
      </motion.button>
    </motion.div>
  )
}
