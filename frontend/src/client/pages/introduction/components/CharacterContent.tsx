import type { Showcase } from '../../../slices/types'

import { AnimatePresence, motion } from 'framer-motion'
import React from 'react'

import { characterFade, fadeExit } from '../../../FramerAnimations'
import { prependApiUrl } from '../../../utils/Url'

export interface Props {
  showcase?: Showcase
}

export const CharacterContent: React.FC<Props> = ({ showcase }) => {
  return (
    <motion.div variants={fadeExit} initial="hidden" animate="show" exit="exit" className="h-full">
      {showcase ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={showcase.persona.type}
            variants={characterFade}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex flex-col h-full justify-around"
          >
            <div className="p-2 bg-bcgov-blue dark:bg-bcgov-gold text-white rounded-l-lg flex px-4 self-end">
              <p>{showcase.persona.type}</p>
            </div>
            <img className="h-72" src={prependApiUrl(showcase.persona.image)} alt={showcase.persona.name} />
          </motion.div>
        </AnimatePresence>
      ) : (
        <p className="flex h-full items-center justify-center text-grey">SELECT YOUR CHARACTER</p>
      )}
    </motion.div>
  )
}
