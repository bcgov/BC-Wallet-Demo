import { useState } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { StepType } from '@/types'
import { ArrowRight, Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'

import StepHeader from '../step-header'

interface StepTypeOption {
  type: StepType.BASIC | StepType.SERVICE | StepType.HUMAN_TASK
  title: string
  subtitle: string
  features: string[]
}

export const ChooseStepType = ({ addNewStep }: { addNewStep: (type: StepType) => void }) => {
  const t = useTranslations()

  const STEP_TYPES: StepTypeOption[] = [
    {
      type: StepType.HUMAN_TASK,
      title: t('scenario.basic_label'),
      subtitle: 'A simple step with title and description',
      features: [
        t('onboarding.create_title_label'),
        t('onboarding.create_description_label'),
        t('onboarding.create_image_label'),
      ],
    },
    {
      type: StepType.SERVICE,
      title: t('scenario.proof_request_label'),
      subtitle: 'A step that includes verification',
      features: [
        t('onboarding.create_title_label'),
        t('onboarding.create_description_label'),
        t('onboarding.create_image_label'),
        t('onboarding.create_credentials_label'),
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <StepHeader icon={<Monitor strokeWidth={3} />} title={t('scenario.add_step_label')} />

      <div className="grid gap-4">
        {STEP_TYPES.map((option) => (
          <Card
            key={option.type}
            // className={cn(
            //   "border-[1px]border-gray rounded",
            className={cn(
              'flex flex-row justify-between items-center rounded p-2 w-full text-start border border-light-border-secondary dark:dark-border hover:bg-light-btn-hover dark:hover:bg-dark-btn-hover'
            )}
            //   "hover:border-primary hover:bg-accent/50",
            //   "transition-colors cursor-pointer"
            // )}
            onClick={() => addNewStep(option.type)}
          >
            <h3 className="text-xl font-bold w-1/4">{option.title}</h3>
            <div className="p-6 flex items-center justify-between w-1/4">
              <div className="space-y-1 flex justify-between">
                <ul className="mt-2 space-y-1 text-start">
                  {option.features.map((feature) => (
                    <li key={feature} className="text-sm text-muted-foreground">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="text-2xl font-bold flex items-center gap-2 text-primary">
              {t('onboarding.create_add_step_label')}
              <ArrowRight className="h-5 w-5" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
