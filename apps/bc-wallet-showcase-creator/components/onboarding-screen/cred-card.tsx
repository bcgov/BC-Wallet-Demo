'use client'

import { baseUrl } from '@/lib/utils'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useCredentialDefinition } from '@/hooks/use-credentials'
import { Skeleton } from '@/components/ui/skeleton'
import { useTenant } from '@/providers/tenant-provider'

export const CredCard = ({ definitionId }: { definitionId: string }) => {
  const { data: cred, isLoading } = useCredentialDefinition(definitionId)

  const t = useTranslations('credentials')
  const { tenantId } = useTenant();

  if (isLoading) {
    return <Skeleton className="w-full h-20" />
  }

  return (
    <div className="bg-background p-2 flex mt-2 rounded">
      <Image
        src={`${baseUrl}/${tenantId}/assets/${cred?.credentialDefinition?.icon?.id}/file`}
        unoptimized
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement
          target.src = '/assets/no-image.jpg'
        }}
        alt={'Credential Icon'}
        width={50}
        height={50}
        className="rounded-full"
      />
      <div className="align-middle ml-auto text-right">
        <div className="font-semibold">{t('attributes_label')}</div>
        <div className="text-sm text-end">{cred?.credentialDefinition?.credentialSchema?.attributes?.length ?? 0}</div>
      </div>
    </div>
  )
}
