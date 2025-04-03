import { motion } from 'framer-motion'
import React from 'react'

import { fadeX } from '../../../FramerAnimations'

export interface Props {
  title: string
  text: string
  characterName: string
}

export const SetupCompleted: React.FC<Props> = ({ title, text, characterName }) => {
  const lastIndex = title.lastIndexOf(' ')
  const lastWord = <p className="inline text-bcgov-blue dark:text-bcgov-gold">{title.substring(lastIndex + 1)}</p>
  const newTitle = title.substring(0, lastIndex)

  return (
    <motion.div className="h-full" variants={fadeX} initial="hidden" animate="show" exit="exit">
      <div className="flex flex-col leading-loose">
        <div className="flex-1 my-4">
          <h2 className="text-3xl md:text-4xl font-semibold dark:text-white">
            {newTitle}&nbsp;
            {lastWord}
          </h2>
        </div>
        <div className="pt-4 flex-1 mb-6">
          <div className="dark:text-white">
            <p>{text}</p>
            <div className="bg-bcgov-white dark:bg-bcgov-black py-4 px-8">
              <ul className="list-disc">
                <li>You control when you use your credentials</li>
                <li>You can share all or parts of your credentials</li>
                <li>No one else is told when you use them</li>
                <li>The information on your credentials is always shared over a secure connection</li>
                <li>Anyone who receives information from your credentials can trust its legitimacy</li>
              </ul>
            </div>
            <p>We're done with this step. Next, we'll explore ways you can use your credentials.</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
