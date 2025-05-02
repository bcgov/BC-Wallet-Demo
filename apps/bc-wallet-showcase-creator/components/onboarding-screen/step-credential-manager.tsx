'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CredentialDefinition, Source } from 'bc-wallet-openapi'
import { useCredentials } from '@/hooks/use-credentials-store'
import { useCredentialDefinitions } from '@/hooks/use-credentials'
import { DisplaySearchResults } from './display-search-results'
import { DisplayAddedCredentials } from './display-added-credentials'

interface StepCredentialManagerProps {
  currentStepCredentials: CredentialDefinition[] | undefined
  onUpdateCredentials: (credentials: CredentialDefinition[]) => void
}

export const StepCredentialManager: React.FC<StepCredentialManagerProps> = ({
  currentStepCredentials = [],
  onUpdateCredentials,
}) => {
  const t = useTranslations()
  const { setSelectedCredential } = useCredentials()
  const [searchResults, setSearchResults] = useState<CredentialDefinition[]>([])
  const { data: credentials } = useCredentialDefinitions()

  const searchCredential = (searchText: string) => {
    setSearchResults([])
    if (!searchText) return

    const searchUpper = searchText.toUpperCase()

    if (!Array.isArray(credentials?.credentialDefinitions)) {
      console.error('Invalid credential data format')
      return
    }

    const results = credentials.credentialDefinitions.filter((cred: CredentialDefinition) =>
      cred.source === Source.Created && cred.name.toUpperCase().includes(searchUpper),
    )

    setSearchResults(results)
  }

  const addCredential = (credential: CredentialDefinition) => {
    if (!Array.isArray(currentStepCredentials)) {
      onUpdateCredentials([credential])
    } else if (!currentStepCredentials.some(cred => cred.id === credential.id)) {
      onUpdateCredentials([...currentStepCredentials, credential])
    }
    setSearchResults([])
  }

  const removeCredential = (credential: CredentialDefinition) => {
    if (Array.isArray(currentStepCredentials)) {
      const updated = currentStepCredentials.filter((cred) => cred.id !== credential.id)
      onUpdateCredentials(updated)
    }
    setSelectedCredential(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-2xl font-bold">{t('onboarding.add_your_credential_label')}</p>
        <hr className="border border-black" />
      </div>

      <div className="mt-6">
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

      <DisplayAddedCredentials
        credentials={currentStepCredentials as CredentialDefinition[]}
        removeCredential={removeCredential}
        updateCredentials={onUpdateCredentials}
      />
    </div>
  )
}