'use client'

import React from 'react'
import { Edit } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { StepRequest } from 'bc-wallet-openapi'

interface StepPreviewProps {
  currentStep: StepRequest
  toggleViewMode: () => void
  baseUrl: string
}

export const StepPreview: React.FC<StepPreviewProps> = ({ 
  currentStep, 
  toggleViewMode,
  baseUrl 
}) => {
  const t = useTranslations()

  return (
    <div className="space-y-6">
      <div className="flex justify-between mt-3">
        <div>
          <p className="text-foreground text-sm">{t('onboarding.section_title')}</p>
          <h3 className="text-2xl font-bold text-foreground">{t('onboarding.details_step_header_title')}</h3>
        </div>
        <Button variant="outline" onClick={toggleViewMode} className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          {t('action.edit_label')}
        </Button>
      </div>
      <hr />

      <div className="space-y-6">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">{t('onboarding.page_title_label')}</h4>
          <p className="text-lg">{currentStep.title}</p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">{t('onboarding.page_description_label')}</h4>
          <p className="text-lg whitespace-pre-wrap">{currentStep.description}</p>
        </div>

        {currentStep.asset && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">{t('onboarding.icon_label')}</h4>
            <div className="w-32 h-32 rounded-lg overflow-hidden border">
              <Image
                src={`${baseUrl}/assets/${currentStep.asset}/file` || '/assets/no-image.jpg'}
                alt="Step icon"
                className="w-full object-cover"
                width={128}
                height={128}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}