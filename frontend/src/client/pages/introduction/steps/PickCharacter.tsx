import type { Showcase, TextWithImage } from '../../../slices/types'

import { motion } from 'framer-motion'
import { track } from 'insights-js'
import React from 'react'

import { fadeX } from '../../../FramerAnimations'
import { useAppDispatch } from '../../../hooks/hooks'
import { useDarkMode } from '../../../hooks/useDarkMode'
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
  const darkMode = useDarkMode()
  const defaultTitle = `Who do you want to be today?`
  const defaultText = `It's time to pick your character. Every character has its own set of use cases, which explore the power of digital credentials. Don't worry, you can change your character later.`
  const titleText = title
  const mainText = text

  const CharacterClickHandler = (showcase: Showcase) => {
    dispatch(setShowcase(showcase))
    track({
      id: 'character-selected',
      parameters: {
        character: showcase.persona?.name || 'unknown',
      },
    })
  }

  const renderCharacters = showcases.map((showcase: Showcase) => {
    const cardStyleSelected = `shadow-xl ring-4 ${darkMode ? 'ring-bcgov-gold' : 'ring-bcgov-blue'}`
    const cardStyleUnselected = `ring-4 ${darkMode ? 'ring-bcgov-black' : 'ring-bcgov-white'}`

    return (
      <motion.button
        key={showcase.persona?.type || 'unknown'}
        onClick={() => CharacterClickHandler(showcase)}
        className="flex flex-col items-center min-w-0"
        data-cy="select-char"
      >
        <motion.img
          whileHover={{ scale: 1.05 }}
          className={`m-auto h-36 w-36 sm:h-36 sm:w-36 md:h-36 md:w-36 md:p-4 lg:h-36 lg:w-36 p-8 rounded-full bg-bcgov-white dark:bg-bcgov-black my-6 shadow object-contain ${
            currentShowcase?.persona?.type === showcase.persona?.type ? cardStyleSelected : cardStyleUnselected
          }`}
          src={prependApiUrl(showcase.persona?.image || '')}
          alt={showcase.persona?.name}
        />
        <div className="w-full flex flex-col text-center dark:text-white min-w-0">
          <h2 className="font-bold truncate">{showcase.persona?.name}</h2>
          <p className="truncate">{showcase.persona?.type}</p>
        </div>
      </motion.button>
    )
  })

  return (
    <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit" className="flex flex-col overflow-hidden">
      <StepInformation
        title={titleText === '' ? defaultTitle : titleText}
        text={mainText === '' ? defaultText : mainText}
        textWithImage={textWithImage}
      />

      <div className="p-4 overflow-y-auto">
        <div
          className={`grid gap-4 ${showcases.length === 1 ? 'grid-cols-1' : showcases.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}
        >
          {renderCharacters}
        </div>
      </div>
    </motion.div>
  )
}
