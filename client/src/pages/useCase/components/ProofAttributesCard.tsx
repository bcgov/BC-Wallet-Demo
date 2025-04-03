import type { Attribute, CredentialRequest } from '../../../slices/types'

import { startCase } from 'lodash'
import React, { useEffect, useState } from 'react'

import { CheckMark } from '../../../components/Checkmark'
import { Loader } from '../../../components/Loader'
import { isDataUrl } from '../../../utils/Helpers'
import { getAttributesFromProof } from '../../../utils/ProofUtils'
import { prependApiUrl } from '../../../utils/Url'

export interface Props {
  entityName: string
  requestedCredentials: CredentialRequest[]
  proof: any
  proofReceived: boolean
}

export const ProofAttributesCard: React.FC<Props> = ({ entityName, requestedCredentials, proof, proofReceived }) => {
  const [values, setValues] = useState<Attribute[]>([])

  const formatDate = (prop: string) => {
    const year = prop.substring(0, 4)
    const month = prop.substring(4, 6)
    const day = prop.substring(6, 8)
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    if (proofReceived) {
      const attr = getAttributesFromProof(proof)
      setValues(attr)
    }
  }, [proofReceived])

  const renderRequestedCreds = requestedCredentials.map((item) => {
    return (
      <div className="block md:flex lg:block flex-1 lg:flex-col items-center justify-between pt-4" key={item.name}>
        <div className="flex flex-1 flex-row">
          {item.icon && (
            <div className="bg-bcgov-lightgrey dark:bg-bcgov-darkgrey rounded-lg p-2 w-12">
              <img className="h-8 m-auto" src={prependApiUrl(item.icon)} alt="icon" />
            </div>
          )}
          <div className="flex flex-1 flex-row justify-between px-4 dark:text-white m-auto">
            <p className="font-semibold self-center">{startCase(item.name)}</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col md:pl-16">
          {item.properties?.map((prop: string) => {
            const value = values.find((x) => x.name === prop)?.value
            return (
              <div key={prop} className="flex flex-row">
                <div
                  style={{ justifySelf: 'center', alignSelf: 'center' }}
                  className="flex-1-1 text-sm bg-bcgov-lightgrey dark:bg-bcgov-darkgrey p-1 px-2 rounded-lg my-1 md:m-2"
                >
                  <p>{prop.charAt(0).toUpperCase() + prop.slice(1)}</p>
                </div>
                {isDataUrl(value) ? (
                  <div className="text-sm bg-white dark:bg-grey p-1 px-2 rounded-lg m-2 truncate">
                    <img src={value} style={{ height: 100 }} />
                  </div>
                ) : (
                  <p className="flex-1 text-sm bg-white dark:bg-grey p-1 px-2 rounded-lg m-2 truncate">
                    {value && prop.includes('Date') ? formatDate(value) : value}
                  </p>
                )}
              </div>
            )
          })}
          {item.predicates && (
            <div className="flex flex-row">
              <p className="flex-1-1 text-sm bg-bcgov-lightgrey dark:bg-bcgov-darkgrey p-1 px-2 rounded-lg m-2">
                {item.predicates.name.charAt(0).toUpperCase() + item.predicates.name.slice(1)}
              </p>
              <p className="flex-1 text-sm bg-white dark:bg-grey p-1 px-2 rounded-lg m-2">{proofReceived && 'OK'}</p>
            </div>
          )}
        </div>
      </div>
    )
  })

  return (
    <div className="flex flex-col bg-bcgov-white dark:bg-bcgov-black p-4 md:mb-8 rounded-lg shadow max-h-64 my-2 sm:max-h-72 md:max-h-96 overflow-auto">
      <div className="flex-1-1 title">
        <div className="flex flex-row">
          <h1 className="flex flex-1 font-semibold dark:text-white">{entityName} would like to know:</h1>
          <div className="flex-1-1 h-8 mb-2">{proofReceived ? <CheckMark /> : <Loader />}</div>
        </div>
        <hr className="text-bcgov-lightgrey" />
      </div>
      <div className="flex flex-col">{renderRequestedCreds}</div>
    </div>
  )
}
