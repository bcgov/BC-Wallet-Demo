import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

import { fadeDelay, fadeExit } from '../../../FramerAnimations'
import { BackButton } from '../../../components/BackButton'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'

export interface Props {
  introductionStep: string
  addIntroductionStep(): void
  removeIntroductionStep(): void
  forwardDisabled: boolean
  backDisabled: boolean
  introductionCompleted(): void
  onExit(): void
  showExitButton: boolean
}

export const IntroductionBottomNav: React.FC<Props> = ({
  introductionStep,
  addIntroductionStep,
  removeIntroductionStep,
  forwardDisabled,
  backDisabled,
  introductionCompleted,
  onExit,
  showExitButton,
}) => {
  const [label, setLabel] = useState('NEXT')
  const [showExitConfirm, setShowExitConfirm] = useState(false)
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
        {showExitButton ? (
          <BackButton onClick={() => setShowExitConfirm(true)} label="EXIT" />
        ) : (
          <BackButton onClick={removeIntroductionStep} disabled={backDisabled} data-cy="prev-introduction-step" />
        )}
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
      {showExitConfirm && (
        <Modal
          title="Exit Credential Flow?"
          description="You will be returned to the landing page. Your progress will be lost."
          onOk={onExit}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </motion.div>
  )
}
