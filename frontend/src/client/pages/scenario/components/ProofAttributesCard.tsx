import type { Attribute, CredentialRequest } from '../../../slices/types'

import startCase from 'lodash/startCase'
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
      <section className="min-w-0 py-5" key={item.name}>
        <div className="mb-3 flex items-center gap-3">
          {item.icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bcgov-lightgrey dark:bg-bcgov-darkgrey p-2">
              <img className="h-full w-full object-contain" src={prependApiUrl(item.icon)} alt="" />
            </div>
          )}
          <h2 className="min-w-0 break-words font-semibold text-bcgov-blue dark:text-white">{startCase(item.name)}</h2>
        </div>
        <dl className="flex flex-wrap gap-2">
          {item.properties?.map((prop: string) => {
            const value = values.find((x) => x.name === prop)?.value
            return (
              <div
                key={prop}
                className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-bcgov-lightgrey bg-white px-3 py-2 text-sm dark:border-bcgov-darkgrey dark:bg-bcgov-darkgrey"
              >
                <dt className="min-w-0 break-words text-bcgov-darkgrey dark:text-bcgov-lightgrey">{startCase(prop)}</dt>
                {isDataUrl(value) ? (
                  <dd className="min-w-0">
                    <img src={value} alt={startCase(prop)} className="h-24 w-24 max-w-full object-contain" />
                  </dd>
                ) : (
                  <dd className="min-w-0 font-semibold text-bcgov-blue dark:text-white [overflow-wrap:anywhere]">
                    {value && prop.includes('Date') ? formatDate(value) : value}
                  </dd>
                )}
              </div>
            )
          })}
          {item.predicates?.map((predicate) => (
            <div
              key={predicate.name}
              className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-bcgov-lightgrey bg-white px-3 py-2 text-sm dark:border-bcgov-darkgrey dark:bg-bcgov-darkgrey"
            >
              <dt className="min-w-0 break-words text-bcgov-darkgrey dark:text-bcgov-lightgrey">{predicate.name}</dt>
              <dd className="font-semibold text-bcgov-blue dark:text-white">{proofReceived && 'OK'}</dd>
            </div>
          ))}
        </dl>
      </section>
    )
  })

  return (
    <div className="my-2 flex w-full min-w-0 flex-col rounded-lg bg-bcgov-white p-4 shadow md:mb-8 md:p-6 dark:bg-bcgov-black dark:text-white">
      <div className="flex items-center justify-between gap-4 border-b border-bcgov-lightgrey pb-4 dark:border-bcgov-darkgrey">
        <h1 className="min-w-0 break-words font-semibold">{entityName} would like to know:</h1>
        <div className="h-8 shrink-0">{proofReceived ? <CheckMark /> : <Loader />}</div>
      </div>
      <div className="flex min-w-0 flex-col divide-y divide-bcgov-lightgrey dark:divide-bcgov-darkgrey">
        {renderRequestedCreds}
      </div>
    </div>
  )
}
