import React, { FC, useState } from 'react'
import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { motion } from 'framer-motion'
import { Modal } from '../../../components/Modal'
import { SmallButtonText } from '../../../components/SmallButtonText'
import { fade } from '../../../FramerAnimations'
import { useAppDispatch } from '../../../hooks/hooks'
import { showcaseServerBaseUrl } from '../../../api/BaseUrl'
import { basePath } from '../../../utils/BasePath';
import { useNavigate } from 'react-router-dom';
import type { Persona } from '../../../slices/types'

export interface Props {
  currentPersona: Persona
}

export const ProfileCard: FC<Props> = ({ currentPersona }) => {
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const MODAL_TITLE = 'This will reset your dashboard.'
  const MODAL_DESCRIPTION = `Your current credentials will become invalid. Please make sure you've completed all the use cases
  before you do this.`

  const reset = () => {
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'leave',
          path: currentPersona.role,
          step: 'dashboard',
        },
      },
    })
    navigate(`${basePath}/`)
    dispatch({ type: 'demo/RESET' })
  }

  const cancel = () => {
    setIsChangeModalOpen(false)
  }

  return (
    <div className="bg-white dark:bg-bcgov-darkgrey rounded-lg h-auto w-auto shadow-sm p-4 md:p-6 lg:p-8 lg:mb-4">
      <motion.div initial="hidden" animate="show" exit="exit" variants={fade}>
        { currentPersona.bodyImage &&
            <motion.img
                whileHover={{ scale: 1.05 }}
                className="m-auto h-32 w-32 md:h-36 md:w-36 p-4 rounded-full bg-bcgov-white dark:bg-bcgov-black ring-2 ring-white mb-4 shadow"
                src={`${showcaseServerBaseUrl}/assets/${currentPersona.bodyImage}/file`}
                alt={currentPersona.name}
            />
        }
        <h1 className="font-bold text-lg flex flex-1 justify-center mb-4">{currentPersona.name}</h1>
        {/* FIXME we are using the onboarding step text here */}
        {/*<p className="text-sm xl:text-base">*/}
        {/*  {currentPersona.description ??*/}
        {/*    currentCharacter?.onboarding.find((screen) => screen.screenId === 'PICK_CHARACTER')?.text}*/}
        {/*</p>*/}
        <div className="flex flex-1 items-end justify-end mt-2">
          <SmallButtonText text="LEAVE" onClick={() => setIsChangeModalOpen(true)} disabled={false} />
        </div>
        {isChangeModalOpen && (
          <Modal
              title={MODAL_TITLE}
              description={MODAL_DESCRIPTION}
              onOk={reset}
              onCancel={cancel}
          />
        )}
      </motion.div>
    </div>
  )
}
