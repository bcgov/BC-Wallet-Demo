'use client'

import { baseUrl } from '@/lib/utils'
import { useTenant } from '@/providers/tenant-provider'
import type { Persona, CredentialDefinition } from 'bc-wallet-openapi'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

export const PublishInfo = ({
                              characters,
                              credentials,
                            }: {
  characters: Partial<Persona>[]
  credentials: Partial<CredentialDefinition>[]
}) => {
  const t = useTranslations()
  const displayCreds = false
  const { tenantId } = useTenant();

  return (
    <div className=" border rounded-md p-4">
      <div className="flex flex-col gap-4">
        {(characters || []).map((char, index) => (
          <div
            key={index}
            className="bg-white dark:bg-dark-bg border-foreground/10 border rounded-lg shadow-lg p-6 flex flex-col"
          >
            {/* Character Header */}
            <div className="flex items-center gap-4">
              <Image
                src={
                  char.headshotImage?.id ? `${baseUrl}/${tenantId}/assets/${char.headshotImage.id}/file` : '/assets/no-image.jpg'
                }
                alt={char.headshotImage?.description || 'Character headshot'}
                width={60}
                height={60}
                className="rounded-full object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold text-foreground">{char.name}</h3>
                <p className="text-foreground/60 text-sm">{char.role}</p>
              </div>
            </div>

            {/* Credential Section */}
            {displayCreds && (
              <div className="mt-4 border-l-[10px] border  border-border-light border-l-light-yellow bg-foreground/10 rounded-md p-4">
                <p className="font-semibold text-sm text-foreground">{t('showcases.publish_info_credentials')}</p>

                <div className="mt-3 space-y-3">
                  {credentials?.map((cred, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Image
                        src={cred.icon?.id ? `${baseUrl}/${tenantId}/assets/${cred.icon.id}/file` : '/assets/no-image.jpg'}
                        alt={cred.icon?.description || 'Credential icon'}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-foreground">{cred.name}</p>
                        <p className="text-foreground/60 text-sm">{'Test college'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
