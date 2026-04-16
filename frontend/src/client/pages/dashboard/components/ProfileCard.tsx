import type { CustomCharacter } from '../../../slices/types'

import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { motion } from 'framer-motion'
import React, { useState } from 'react'

import { fade } from '../../../FramerAnimations'
import { Modal } from '../../../components/Modal'
import { SmallButtonText } from '../../../components/SmallButtonText'
import { useAppDispatch } from '../../../hooks/hooks'
import { prependApiUrl } from '../../../utils/Url'

export interface Props {
  currentCharacter: CustomCharacter
}

export const ProfileCard: React.FC<Props> = ({ currentCharacter }) => {
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false)
  const dispatch = useAppDispatch()

  const MODAL_TITLE = 'This will reset your dashboard.'
  const MODAL_DESCRIPTION = `Your current credentials will become invalid. Please make sure you've completed all the use cases
  before you do this.`

  const reset = () => {
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'leave',
          path: currentCharacter.type,
          step: 'dashboard',
        },
      },
    })
    dispatch({ type: 'demo/RESET' })
  }

  const cancel = () => {
    setIsChangeModalOpen(false)
  }

  return (
    <div className="bg-white dark:bg-bcgov-darkgrey rounded-lg h-auto w-auto shadow-sm p-4 md:p-6 lg:p-8 lg:mb-4">
      <motion.div initial="hidden" animate="show" exit="exit" variants={fade}>
        <motion.img
          whileHover={{ scale: 1.05 }}
          className="m-auto h-32 w-32 md:h-36 md:w-36 p-4 rounded-full bg-bcgov-white dark:bg-bcgov-black ring-2 ring-white mb-4 shadow"
          src={prependApiUrl(currentCharacter.image)}
          alt={currentCharacter.name}
        />

        <h1 className="font-bold text-lg flex flex-1 justify-center mb-4">{currentCharacter.name}</h1>
        <p className="text-sm xl:text-base">
          {currentCharacter.description ??
            currentCharacter?.onboarding.find((screen) => screen.screenId === 'PICK_CHARACTER')?.text}
        </p>
        <div className="flex flex-1 items-end justify-end mt-2">
          <SmallButtonText text="LEAVE" onClick={() => setIsChangeModalOpen(true)} disabled={false} />
        </div>

        {isChangeModalOpen && (
          <Modal title={MODAL_TITLE} description={MODAL_DESCRIPTION} onOk={reset} onCancel={cancel} />
        )}
      </motion.div>
    </div>
  )
}
