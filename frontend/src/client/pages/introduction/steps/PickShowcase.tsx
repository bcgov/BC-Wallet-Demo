import type { Showcase, TextWithImage } from '../../../slices/types'

import { IdentificationIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { track } from 'insights-js'
import React from 'react'

import { fadeX } from '../../../FramerAnimations'
import { useAppDispatch } from '../../../hooks/hooks'
import { setShowcase } from '../../../slices/showcases/showcasesSlice'
import { prependApiUrl } from '../../../utils/Url'
import { StepInformation } from '../components/StepInformation'

export interface Props {
  currentShowcase?: Showcase
  showcases: Showcase[]
  title: string
  text: string
  textWithImage?: TextWithImage[]
}

export const PickCharacter: React.FC<Props> = ({ currentShowcase, showcases, title, text, textWithImage }) => {
  const dispatch = useAppDispatch()
  const defaultTitle = `Select your showcase`
  const defaultText = `Every showcase has its own set of use cases, which explore the power of digital credentials. Don't worry, you can change your showcase later.`
  const titleText = title
  const mainText = text

  const ShowcaseClickHandler = (showcase: Showcase) => {
    dispatch(setShowcase(showcase))
    track({
      id: 'character-selected',
      parameters: {
        character: showcase.persona?.name || 'unknown',
      },
    })
  }

  const renderShowcases = showcases.map((showcase: Showcase) => {
    const isSelected = currentShowcase?.persona?.type === showcase.persona?.type
    const cardStyle = isSelected
      ? 'ring-2 ring-bcgov-blue dark:ring-white shadow-lg'
      : 'ring-1 ring-bcgov-lightgrey dark:ring-bcgov-darkgrey shadow-sm hover:shadow-md'

    return (
      <motion.button
        key={showcase.persona?.type || 'unknown'}
        onClick={() => ShowcaseClickHandler(showcase)}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        aria-pressed={isSelected}
        className={`flex flex-col text-left min-w-0 rounded-xl overflow-hidden bg-white dark:bg-bcgov-darkgrey dark:text-white transition-shadow duration-300 ${cardStyle}`}
        data-cy="select-char"
      >
        <div className="relative flex items-center justify-center w-full h-36 bg-bcgov-white dark:bg-bcgov-black">
          <img
            className="h-28 w-28 object-contain"
            src={prependApiUrl(showcase.persona?.image || '')}
            alt={showcase.persona?.name}
          />
          {isSelected && (
            <span className="absolute top-2 right-2 flex items-center justify-center h-6 w-6 rounded-full bg-bcgov-blue text-white">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>
        <div className="flex flex-col w-full p-4 min-w-0">
          <h2 className="font-bold text-lg text-bcgov-blue dark:text-white truncate">{showcase.name}</h2>
          <p className="text-xs font-semibold uppercase tracking-wide text-bcgov-darkgrey dark:text-bcgov-lightgrey truncate">
            {showcase.persona?.name}
            {showcase.persona?.type ? ` · ${showcase.persona.type}` : ''}
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-bcgov-blue dark:text-bcgov-lightgrey">
            <IdentificationIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>
              {showcase.credentials.length} {showcase.credentials.length === 1 ? 'credential' : 'credentials'}
            </span>
          </p>
          {showcase.description && (
            <p className="mt-2 text-sm text-bcgov-darkgrey dark:text-bcgov-lightgrey line-clamp-3">
              {showcase.description}
            </p>
          )}
        </div>
      </motion.button>
    )
  })

  return (
    <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit" className="flex flex-col">
      <StepInformation
        title={titleText === '' ? defaultTitle : titleText}
        text={mainText === '' ? defaultText : mainText}
        textWithImage={textWithImage}
      />

      <div className="p-4">
        <div
          className={`grid gap-4 ${showcases.length === 1 ? 'grid-cols-1' : showcases.length === 2 || showcases.length === 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}
        >
          {renderShowcases}
        </div>
      </div>
    </motion.div>
  )
}
