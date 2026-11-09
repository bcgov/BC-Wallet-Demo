import type { Showcase } from '../../../slices/types'

import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { motion } from 'framer-motion'
import React, { useState } from 'react'

import { fade } from '../../../FramerAnimations'
import { Modal } from '../../../components/Modal'
import { SmallButtonText } from '../../../components/SmallButtonText'
import { useAppDispatch } from '../../../hooks/hooks'
import { prependApiUrl } from '../../../utils/Url'

export interface Props {
  currentShowcase: Showcase
}

export const ProfileCard: React.FC<Props> = ({ currentShowcase }) => {
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
          path: currentShowcase.persona?.type,
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
    <div className="bg-white dark:bg-bcgov-darkgrey rounded-2xl h-auto w-auto shadow-md overflow-hidden border-t-8 border-bcgov-gold p-4 md:p-6 lg:p-8 lg:mb-4">
      <motion.div initial="hidden" animate="show" exit="exit" variants={fade}>
        <motion.img
          whileHover={{ scale: 1.05 }}
          className="m-auto h-32 w-32 md:h-36 md:w-36 p-4 rounded-full bg-bcgov-white dark:bg-bcgov-black ring-4 ring-bcgov-gold ring-offset-2 ring-offset-white dark:ring-offset-bcgov-darkgrey mb-4 shadow-lg object-contain"
          src={prependApiUrl(currentShowcase.persona?.image || '')}
          alt={currentShowcase.persona?.name}
        />

        <h1 className="font-bold text-xl text-bcgov-blue dark:text-white flex flex-1 justify-center mb-2">
          {currentShowcase.persona?.name}
        </h1>
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-bcgov-gold" aria-hidden="true" />
        <p className="text-sm xl:text-base text-center text-bcgov-darkgrey dark:text-bcgov-lightgrey leading-relaxed">
          {currentShowcase.description ??
            currentShowcase?.introduction.find((screen) => screen.screenId === 'PICK_CHARACTER')?.text}
        </p>
        <div className="flex flex-1 items-end justify-end mt-4 pt-3 border-t border-bcgov-lightgrey dark:border-bcgov-black">
          <SmallButtonText text="LEAVE" onClick={() => setIsChangeModalOpen(true)} disabled={false} />
        </div>

        {isChangeModalOpen && (
          <Modal title={MODAL_TITLE} description={MODAL_DESCRIPTION} onOk={reset} onCancel={cancel} />
        )}
      </motion.div>
    </div>
  )
}
