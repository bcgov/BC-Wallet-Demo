'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CredentialDefinition, Source } from 'bc-wallet-openapi'
import { useCredentials } from '@/hooks/use-credentials-store'
import { useCredentialDefinition, useCredentialDefinitions } from '@/hooks/use-credentials'
import { DisplaySearchResults } from './display-search-results'
import { DisplayCredential } from './display-added-credentials'
import { useJobStatus } from '../../hooks/use-job-status'

interface StepCredentialManagerProps {
  currentStepCredential: string | undefined
  onUpdateCredentials: (credentialId: string) => void
}

export const StepCredentialManager: React.FC<StepCredentialManagerProps> = ({
  currentStepCredential,
  onUpdateCredentials,
}) => {
  const t = useTranslations()
  const { setSelectedCredential } = useCredentials()
  const [searchResults, setSearchResults] = useState<CredentialDefinition[]>([])
  const { data: credentials } = useCredentialDefinitions()
  const { data: credential } = useCredentialDefinition(currentStepCredential || '')
  const { data: jobsApprovalFailed } = useJobStatus('updateIssuer', 'failed')
  const { data: jobsStatus } = useJobStatus('credentialDefinition', 'pending')


  const searchCredential = (searchText: string) => {
    setSearchResults([])
    if (!searchText) return

    const searchUpper = searchText.toUpperCase()

    if (!Array.isArray(credentials?.credentialDefinitions)) {
      console.error('Invalid credential data format')
      return
    }

    let results = credentials.credentialDefinitions.filter(
      (cred: CredentialDefinition) => cred.source === Source.Created && cred.name.toUpperCase().includes(searchUpper),
    )
    if (jobsApprovalFailed && jobsApprovalFailed.jobStatus?.length > 0) {
      results = results.filter((cred) =>
        jobsApprovalFailed?.jobStatus?.find((job) => job?.payloadData?.identifier !== cred.credentialSchema.identifier))
    }
    if (jobsStatus && jobsStatus?.jobStatus?.length > 0) {
      results = results.filter((cred) =>
        jobsStatus?.jobStatus?.find((job) => job?.payloadData?.identifier !== cred.credentialSchema.identifier))
    }

    setSearchResults(results)
  }

  const addCredential = (credential: CredentialDefinition) => {
    if (!currentStepCredential) {
      onUpdateCredentials(credential.id)
    } else if (currentStepCredential !== credential.id) {
      onUpdateCredentials(credential.id)
    }
    setSearchResults([])
  }

  const removeCredential = () => {
    onUpdateCredentials('')
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-md font-bold text-foreground/80">{t('onboarding.add_your_credential_label')}<span className="text-red-500">*</span></p>
        <hr className="border border-black" />
      </div>

      <div className="mt-6">
        <p className="text-sm text-muted-foreground mb-4">{'In this section, you must search for and select a credential to be issued. The attributes available will be displayed. Enter the attribute values for the credential. Please make sure to Save before proceeding'}</p>
        <p className="text-md font-bold">{t('onboarding.search_credential_label')}</p>
        <div className="flex flex-row justify-center items-center my-4">
          <div className="relative w-full">
            <input
              className="dark:text-dark-text dark:bg-dark-input rounded pl-2 pr-10 mb-2 w-full border"
              placeholder={t('onboarding.search_credential_placeholder')}
              type="text"
              onChange={(e) => searchCredential(e.target.value)}
            />
          </div>
        </div>
      </div>

      <DisplaySearchResults searchResults={searchResults} addCredential={addCredential} />

      {currentStepCredential && (
        <DisplayCredential
          credentialId={currentStepCredential}
          removeCredential={removeCredential}
          onCredentialUpdate={onUpdateCredentials}
        />
      )}
    </div>
  )
}
