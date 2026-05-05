import type { CustomCharacter } from '../../../slices/types'

import { AnimatePresence, motion } from 'framer-motion'
import React from 'react'

import { characterFade, fadeExit } from '../../../FramerAnimations'
import { prependApiUrl } from '../../../utils/Url'

export interface Props {
  character?: CustomCharacter
}

export const CharacterContent: React.FC<Props> = ({ character }) => {
  return (
    <motion.div variants={fadeExit} initial="hidden" animate="show" exit="exit" className="h-full">
      {character ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={character.type}
            variants={characterFade}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex flex-col h-full justify-around"
          >
            <div className="p-2 bg-bcgov-blue dark:bg-bcgov-gold text-white rounded-l-lg flex px-4 self-end">
              <p>{character.type}</p>
            </div>
            <img className="h-72" src={prependApiUrl(character.image)} alt={character.name} />
          </motion.div>
        </AnimatePresence>
      ) : (
        <p className="flex h-full items-center justify-center text-grey">SELECT YOUR CHARACTER</p>
      )}
    </motion.div>
  )
}
