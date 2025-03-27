import React from 'react'

import { motion } from 'framer-motion'
import { track } from 'insights-js'

import { showcaseServerBaseUrl } from '../../../api/BaseUrl'
import { fadeX } from '../../../FramerAnimations'
import { useAppDispatch } from '../../../hooks/hooks'
import { useDarkMode } from '../../../hooks/useDarkMode'
import { setPersona } from '../../../slices/showcases/showcasesSlice'
import type { CustomCharacter, Persona, TextWithImage } from '../../../slices/types'
import { setOnboardingProgress } from '../../../utils/OnboardingUtils'
import { StepInformation } from '../components/StepInformation'

export interface Props {
  currentPersona?: Persona
  personas: Persona[]
  title?: string
  text?: string
  textWithImage?: TextWithImage[]
}

export const PickPersona: React.FC<Props> = ({
                                               currentPersona,
                                               personas,
                                               title = 'Who do you want to be today?',
                                               text = 'It’s time to pick your character. Every character has its own set of use cases, which explore the power of digital credentials. Don’t worry, you can change your character later.',
                                               textWithImage,
                                             }) => {
  const dispatch = useAppDispatch()
  const darkMode = useDarkMode()

  const PersonaClickHandler = async (persona: Persona): Promise<void> => {
    dispatch(setPersona(persona))
    track({
      id: 'persona-selected',
      parameters: {
        character: persona.name,
      },
    })
  }

  const personaElements = personas.map((persona: Persona) => {
    const cardStyleSelected = `shadow-xl ring-4 ${darkMode ? 'ring-bcgov-gold' : 'ring-bcgov-blue'}`
    const cardStyleUnselected = `ring-4 ${darkMode ? 'ring-bcgov-black' : 'ring-bcgov-white'}`

    return (
        <motion.button
            key={persona.role}
            onClick={() => PersonaClickHandler(persona)}
            whileHover={{ scale: 1.01 }}
            className="flex md:flex-row lg:flex-col"
            data-cy="select-char"
        >
          {persona.headshotImage && (
              <motion.img
                  whileHover={{ scale: 1.05 }}
                  className={`m-auto h-16 w-16 p-2 sm:h-20 sm:w-20 md:h-24 md:w-24 md:p-4 lg:h-36 lg:w-36 lg:p-8 rounded-full bg-bcgov-white dark:bg-bcgov-black my-6 shadow ${
                      currentPersona?.role === persona.role ? cardStyleSelected : cardStyleUnselected
                  }`}
                  src={`${showcaseServerBaseUrl}/assets/${persona.headshotImage}/file`}
                  alt={persona.name}
              />
          )}
          <div className="m-auto p-4 flex flex-1 flex-col text-left lg:text-center dark:text-white">
            <h2 className="font-bold">{persona.name}</h2>
            <p>{persona.role}</p>
          </div>
        </motion.button>
    )
  })

  return (
      <motion.div className="h-full" variants={fadeX} initial="hidden" animate="show" exit="exit">
        <StepInformation title={title} text={text} textWithImage={textWithImage} />
        <div className="flex flex-col lg:flex-row items-left lg:items-start justify-between px-8 h-full max-h-72 sm:max-h-96 overflow-y-scroll lg:overflow-y-hidden">
          {personaElements}
        </div>
      </motion.div>
  )
}
