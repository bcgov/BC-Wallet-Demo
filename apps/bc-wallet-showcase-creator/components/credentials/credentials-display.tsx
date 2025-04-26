import { useState } from 'react'

import { useCredentialDefinitions } from '@/hooks/use-credentials'
import { useCredentials } from '@/hooks/use-credentials-store'
import { baseUrl } from '@/lib/utils'
import {CredentialDefinition} from 'bc-wallet-openapi'
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
  const { data: credentials, isLoading } = useCredentialDefinitions()

  const sanitizedSearchTerm = searchTerm?.toLowerCase() || ''

  const filteredCredentials =
    credentials?.credentialDefinitions?.filter((credential: CredentialDefinition) =>
      credential.name?.toLowerCase().includes(sanitizedSearchTerm),
    ) || []

  const handleSelectCredential = (credential: CredentialDefinition) => {
    setSelectedCredential(credential)
    viewCredential(credential)
    setOpenId(credential.id)
  }

  const toggleDetails = (id: string) => {
    if (openId === id) {
      setOpenId(null)
      setSelectedCredential(null)
    } else {
      const credential = credentials?.credentialDefinitions?.find((credential: CredentialDefinition) => credential.id === id)
      if (credential) handleSelectCredential(credential)
    }
  }

  const handleCreate = () => {
    startCreating()
    setOpenId(null)
  }

  return (
    <div className="w-full h-full bg-background border-b dark:border-foreground/10 shadow-lg rounded-lg">
      <div className="p-4 border-b dark:border-dark-border">
        <h2 className="text-lg font-bold">
          {t('credentials.credential_title')} ({filteredCredentials.length})
        </h2>
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
            <div className="border-b dark:border-dark-border">
              {openId === item.id ? (
                <div className="p-3 bg-foreground/10 flex flex-col dark:bg-dark-bg items-center text-center transition-all duration-300">
                  <Image
                    src={item.icon?.id?.trim() ? `${baseUrl}/assets/${item.icon.id}/file` : '/assets/no-image.jpg'}
                    unoptimized
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.src = '/assets/no-image.jpg'
                    }}
                    alt={item.icon?.description || 'Credential icon'}
                    width={75}
                    height={75}
                    className="rounded-full aspect-square object-cover shadow-md"
                  />
                  <span className="text-lg font-semibold mt-2">{item.name}</span>
                  <span className="text-sm text-foreground/80">Version {item.version}</span>
                  <span className="text-sm text-foreground/80">Created</span>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    {item.credentialSchema?.attributes?.map((attr) => (
                      <span
                        key={`${item.id}-${attr.id}-${attr.type || 'unknown'}`}
                        className="text-sm bg-foreground/10 px-2 py-1 rounded transition-all duration-200 hover:bg-foreground/20"
                      >
                        {attr.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => toggleDetails(item.id)}
                  key={item.id}
                  className={`relative p-4 flex flex-row items-center justify-between w-full transition-all duration-300 hover:bg-foreground/10 cursor-pointer ${
                    openId === item.id ? 'bg-foreground/10' : 'bg-background'
                  }`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Image
                      src={item.icon?.id?.trim() ? `${baseUrl}/assets/${item.icon.id}/file` : '/assets/no-image.jpg'}
                      unoptimized
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement
                        target.src = '/assets/no-image.jpg'
                      }}
                      alt={item.icon?.description || 'Credential icon'}
                      width={50}
                      height={50}
                      className="rounded-full aspect-square object-cover transition-all duration-300 scale-100 shadow-md hover:scale-105"
                    />
                    <div className="flex flex-col w-full">
                      <span className="text-lg font-semibold">{item.name}</span>
                      <span className="text-sm text-foreground/80">Version {item.version}</span>
                    </div>
                  </div>
                  <div className="ml-2">
                    <p className="text-sm text-foreground font-semibold">{t('credentials.attributes_label')}</p>
                    <p className="text-sm text-foreground/80">{item.credentialSchema?.attributes?.length || 0}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      <div className="flex flex-col items-center p-4">
        <Button
          type="button"
          variant="outlineAction"
          size="lg"
          className="w-full transition-all duration-200 hover:bg-foreground/10 hover:text-white"
          onClick={handleCreate}
        >
          {t('credentials.add_credential_label')}
        </Button>
      </div>
    </div>
  )
}
