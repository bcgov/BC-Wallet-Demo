import type { CredentialRequest } from '../../../slices/types'

import { startCase } from 'lodash'
import React from 'react'

import { prependApiUrl } from '../../../utils/Url'

export interface Props {
  requestedItems: CredentialRequest[]
}

export const ProofCard: React.FC<Props> = ({ requestedItems }) => {
  const renderRequestedItems = requestedItems.map((item) => {
    return (
      <div className="flex-1 flex flex-row items-center justify-between pt-4 " key={item.name}>
        {item.icon && (
          <div className="bg-bcgov-lightgrey dark:bg-bcgov-black rounded-lg p-2 w-12">
            <img className="h-8 m-auto" src={prependApiUrl(item.icon)} alt="icon" />
          </div>
        )}
        <div className="flex-1 px-4 justify-self-start dark:text-white">
          <p>{startCase(item.name)}</p>
        </div>
      </div>
    )
  })

  return (
    <div className="flex flex-col bg-white dark:bg-bcgov-darkgrey p-4 mb-4 h-auto rounded-lg shadow">
      <div className="flex-1-1 title">
        <h1 className="font-semibold dark:text-white">You'll need to present</h1>
        <hr className="text-bcgov-lightgrey" />
      </div>
      {renderRequestedItems}
    </div>
  )
}
