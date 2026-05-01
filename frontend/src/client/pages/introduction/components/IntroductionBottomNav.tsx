import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

import { fadeDelay, fadeExit } from '../../../FramerAnimations'
import { BackButton } from '../../../components/BackButton'
import { Button } from '../../../components/Button'

export interface Props {
  introductionStep: string
  addIntroductionStep(): void
  removeIntroductionStep(): void
  forwardDisabled: boolean
  backDisabled: boolean
  introductionCompleted(): void
}

export const IntroductionBottomNav: React.FC<Props> = ({
  introductionStep,
  addIntroductionStep,
  removeIntroductionStep,
  forwardDisabled,
  backDisabled,
  introductionCompleted,
}) => {
  const [label, setLabel] = useState('NEXT')
  const isCompleted = introductionStep === 'SETUP_COMPLETED'

  useEffect(() => {
    if (isCompleted) {
      setLabel('FINISH')
    } else if (introductionStep === 'CHOOSE_WALLET') {
      setLabel('SKIP')
    } else {
      setLabel('NEXT')
    }
  }, [isCompleted, introductionStep])

  return (
    <motion.div
      variants={fadeDelay}
      initial="hidden"
      animate="show"
      exit="exit"
      className="flex w-full justify-between mb-4 h-8 self-end select-none"
    >
      <div className="flex self-center">
        <BackButton onClick={removeIntroductionStep} disabled={backDisabled} data-cy="prev-introduction-step" />
      </div>
      <AnimatePresence mode="wait">
        <motion.div variants={fadeExit} initial="hidden" animate="show" exit="exit" data-cy="next-introduction-step">
          <Button
            onClick={isCompleted ? introductionCompleted : addIntroductionStep}
            text={label}
            disabled={forwardDisabled}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
