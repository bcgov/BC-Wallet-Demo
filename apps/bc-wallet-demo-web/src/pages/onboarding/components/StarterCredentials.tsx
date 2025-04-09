import React from 'react'
import { motion } from 'framer-motion'
import { startCase } from 'lodash'
import { StateIndicator } from '../../../components/StateIndicator'
import { fadeX } from '../../../FramerAnimations'
import { useCredentials } from '../../../slices/credentials/credentialsSelectors'
import { showcaseServerBaseUrl } from '../../../api/BaseUrl'
import type { CredentialDefinition } from '../../../slices/types';

export interface Props {
  credentialDefinitions: CredentialDefinition[]
}

export const StarterCredentials: React.FC<Props> = ({ credentialDefinitions }) => {
  const { issuedCredentials } = useCredentials()
  const issuedCredentialsStartCase = issuedCredentials.map((name) => startCase(name))
  return (
    <motion.div
      variants={fadeX}
      animate="show"
      exit="exit"
      className="flex flex-col bg-bcgov-white dark:bg-bcgov-black m-4 px-4 py-2 w-auto md:w-96 h-auto rounded-lg shadow"
    >
      <div className="flex-1-1 title mb-2">
        <h1 className="font-semibold dark:text-white">Starter credentials</h1>
        <hr className="text-bcgov-lightgrey" />
      </div>
      { credentialDefinitions.map(credentialDefinition => {
        const completed = issuedCredentials.includes(credentialDefinition.name) || issuedCredentialsStartCase.includes(credentialDefinition.name)
        return (
          <div key={credentialDefinition.name} className="flex-1 flex flex-row items-center justify-between my-2">
            { credentialDefinition.icon &&
                <div className="bg-bcgov-lightgrey rounded-lg p-2 w-12">
                  <img className="h-8 m-auto" src={`${showcaseServerBaseUrl}/assets/${credentialDefinition.icon}/file`} alt="icon" />
                </div>
            }
            <div className="flex-1 px-4 justify-self-start dark:text-white text-sm sm:text-base">
              <p>{startCase(credentialDefinition.name)}</p>
            </div>
            <StateIndicator completed={completed} />
          </div>
        )
      })}
    </motion.div>
  )
}
