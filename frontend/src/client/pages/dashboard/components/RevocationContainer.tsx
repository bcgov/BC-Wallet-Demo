import type { IssuedCredential } from '../../../api/RevocationApi'
import type { Credential } from '../../../slices/types'
import type { AxiosResponse } from 'axios'

import { motion } from 'framer-motion'
import React, { useState } from 'react'

import { dashboardTitle, rowContainer } from '../../../FramerAnimations'
import { revokeCredential } from '../../../api/RevocationApi'
import log from '../../../utils/logger'

import { RevocationItem } from './RevocationItem'

export interface Props {
  issuedCredentials: IssuedCredential[]
  showcaseCredentials: Credential[]
}

export const RevocationContainer: React.FC<Props> = ({ issuedCredentials, showcaseCredentials }) => {
  const [completedRevocations, setCompletedRevocations] = useState<string[]>([])
  const [loadingRevocations, setLoadingRevocations] = useState<string[]>([])
  const [menuExpanded, setMenuExpanded] = useState<boolean>(false)

  const revocableItems = issuedCredentials.filter((item) => item.status === 'issued')

  const renderScenarios = revocableItems.map((item) => {
    const showcaseCred = showcaseCredentials.find((c) => c.id === item.credentialId)
    return (
      <RevocationItem
        title={showcaseCred?.name}
        credentialName={showcaseCred?.name}
        credentialIcon={showcaseCred?.icon}
        key={item.credExId}
        credExId={item.credExId}
        callback={() => {
          const revocations = completedRevocations.filter((id) => id !== item.credExId)
          setCompletedRevocations(revocations)

          const loadingList = [...loadingRevocations, item.credExId]
          setLoadingRevocations(loadingList)

          revokeCredential(item.credExId)
            .then((result: AxiosResponse<any, any, object>) => {
              if (result.status === 200) {
                revocations.push(item.credExId)
                setCompletedRevocations([...revocations])
              }
              setLoadingRevocations((prev) => prev.filter((id) => id !== item.credExId))
            })
            .catch((err) => {
              log.warn('[revocation] revoke failed', item.credExId, err)
              setLoadingRevocations((prev) => prev.filter((id) => id !== item.credExId))
            })
        }}
        isCompleted={completedRevocations.includes(item.credExId)}
        isLoading={loadingRevocations.includes(item.credExId)}
      />
    )
  })

  return (
    <div className="flex flex-col mx-4 lg:mx-4 my-2 p-4 md:p-6 lg:p-8 bg-white dark:bg-bcgov-darkgrey dark:text-white rounded-lg shadow-sm">
      <motion.h1 variants={dashboardTitle} className="text-3xl md:text-4xl font-bold mb-2">
        Revoking your credentials
      </motion.h1>
      <p className="text-bcgov-blue dark:text-white font-bold">
        Ensure the safety of your personal information if your device is lost or stolen.
      </p>
      {menuExpanded && (
        <motion.div variants={rowContainer} className="flex flex-col w-auto overflow-x-hidden md:overflow-x-visible">
          {renderScenarios}
        </motion.div>
      )}
      <motion.div
        className="mx-0 lg:mx-0 my-2 p-4 md:p-4 lg:p-8"
        style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 'bold' }}
      >
        <motion.button
          className="font-bold"
          onClick={() => {
            setMenuExpanded(!menuExpanded)
          }}
        >
          {menuExpanded ? 'READ LESS' : 'READ MORE'}
        </motion.button>
      </motion.div>
    </div>
  )
}
