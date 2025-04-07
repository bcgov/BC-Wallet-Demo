import { useState } from 'react'

import { useCredentialDefinitions } from '@/hooks/use-credentials'
import { useCredentials } from '@/hooks/use-credentials-store'
import { baseUrl } from '@/lib/utils'
import type { Credential, CredentialAttributeType } from '@/openapi-types'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

import { Button } from '../ui/button'

interface CredentialsDisplayProps {
  searchTerm: string
}

export const CredentialsDisplay = ({ searchTerm }: CredentialsDisplayProps) => {
  const { setSelectedCredential, startCreating, viewCredential } = useCredentials()
  const [openId, setOpenId] = useState<string | null>(null)
  const t = useTranslations()
  const { data: credentials, isLoading, error } = useCredentialDefinitions()

  const sanitizedSearchTerm = searchTerm?.toLowerCase() || ''

  const filteredCredentials =
    credentials?.credentialDefinitions?.filter((credential: Credential) =>
      credential.name?.toLowerCase().includes(sanitizedSearchTerm),
    ) || []

  const handleSelectCredential = (credential: Credential) => {
    setSelectedCredential(credential)
    viewCredential(credential)
    setOpenId(credential.id)
  }

  const toggleDetails = (id: string) => {
    if (openId === id) {
      setOpenId(null)
      setSelectedCredential(null)
    } else {
      const credential = credentials?.credentialDefinitions?.find((credential: Credential) => credential.id === id)
      if (credential) handleSelectCredential(credential)
    }
  }

  const handleCreate = () => {
    startCreating()
    setOpenId(null)
  }
  return (
    <div className="w-full h-full bg-white dark:bg-dark-bg-secondary border-b dark:border-dark-ter  shadow-lg rounded-lg">
      <div className="p-4 border-b dark:border-dark-border ">
        <h2 className="text-lg font-bold">{t('credentials.credential_title')}</h2>
        <p className="text-sm">{t('credentials.credential_subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 mt-4 rounded-full animate-spin"></div>
          {t('credentials.credential_loading')}
        </div>
      ) : (
        filteredCredentials.map((item) => (
          <div className="flex-grow overflow-y-auto" key={item.id}>
            <div className="border-b dark:border-dark-border hover:bg-gray-100">
              {openId === item.id ? (
                <div className="p-3 bg-light-bg flex flex-col dark:bg-dark-bg items-center text-center">
                  <div className="flex flex-col py-2 w-full items-center">
                    <Image
                      src={`${baseUrl}/assets/${item.icon.id}/file` || '/assets/no-image.jpg'}
                      alt={item.icon?.description || 'Credential icon'}
                      width={openId === item.id ? 100 : 50}
                      height={openId === item.id ? 100 : 50}
                      className={`rounded-full aspect-square object-cover transition-all duration-300 ${
                        openId === item.id ? 'scale-110' : 'scale-100'
                      }`}
                    />
                    <span className="text-lg font-semibold mt-2">{item.name}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Version {item.version}</span>

                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      {item.credentialSchema?.attributes?.map((attr: CredentialAttributeType) => (
                        <span
                          key={`${item.id}-${attr.id}-${attr.type || 'unknown'}`}
                          className="bg-gray-200 dark:bg-dark-border px-2 py-1 rounded"
                        >
                          {attr.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => toggleDetails(item.id)}
                  key={item.id}
                  className={`hover:bg-light-bg dark:hover:bg-dark-input-hover relative p-4 flex ${
                    openId === item.id
                      ? 'flex-col items-center bg-gray-100 dark:bg-dark-bg'
                      : 'flex-row items-center bg-white dark:bg-dark-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Image
                      src={`${baseUrl}/assets/${item.icon.id}/file` || '/assets/no-image.jpg'}
                      alt={item.icon?.description || 'Credential icon'}
                      width={openId === item.id ? 100 : 50}
                      height={openId === item.id ? 100 : 50}
                      className={`rounded-full aspect-square object-cover transition-all duration-300 ${
                        openId === item.id ? 'scale-110' : 'scale-100'
                      }`}
                    />
                    <div className="flex flex-col w-full">
                      <span className="text-lg font-semibold mt-2">{item.name}</span>
                      <span className="text-sm text-foreground/80 ">Version {item.version}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-semibold mt-2">{t('credentials.attributes_label')}</p>
                    <p className="text-sm text-foreground/80 ">{item.credentialSchema?.attributes?.length || 0}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      <div className="flex flex-col items-center p-4">
        <Button type="button" variant="outlineAction" size="lg" className="w-full" onClick={handleCreate}>
          CREATE CREDENTIAL
        </Button>
      </div>
    </div>
  )
}
