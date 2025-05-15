import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { cn } from '@/lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { StepActionType } from 'bc-wallet-openapi'
import { Copy, GripVertical, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Screen } from '@/types'
import { useTenant } from '@/providers/tenant-provider'

import { CredCard } from '../onboarding-screen/cred-card'
const MAX_CHARS = 50

export const SortableStep = ({
                               selectedStep,
                               myScreen,
                               stepIndex,
                               scenarioIndex,
                             }: {
  selectedStep: { stepIndex: number, scenarioIndex: number } | null
  myScreen: Screen
  stepIndex: number
  scenarioIndex: number
}) => {
  const t = useTranslations()
  const { handleSelectStep, duplicateStep, activePersonaId, setStepState, activeScenarioIndex, setActiveScenarioIndex } = usePresentationAdapter()
  const { tenantId } = useTenant()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: myScreen.id || `step-${scenarioIndex}-${stepIndex}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  console.log(myScreen.actions)

  const handleStepClick = () => {
    setStepState('editing-basic')
    handleSelectStep(stepIndex, scenarioIndex)

    if (activeScenarioIndex !== scenarioIndex) {
      setActiveScenarioIndex(scenarioIndex);
    }
  };

  const handleCopyStep = (stepIndex: number, scenarioIndex: number) => {
    try {
      if (!activePersonaId) {
        return
      }

      duplicateStep(stepIndex)

      handleSelectStep(stepIndex, scenarioIndex)
    } catch (error) {
      console.error('Error duplicating step:', error)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex mb-2 flex-row items-center w-full bg-background min-h-28"
    >
      <div
        className={`cursor-default h-full flex-shrink-0 flex items-center ${
          myScreen.type == 'SERVICE' ? 'bg-yellow-500' : 'bg-[#898A8A]'
        } px-3 py-5 rounded-l`}
      >
        <div className="flex flex-col gap-3">
          <div {...attributes} {...listeners} className="text-white text-2xl flex flex-col gap-2 cursor-grab">
            <GripVertical />
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation()
              handleCopyStep(stepIndex, scenarioIndex)
            }}
            className="text-white text-2xl flex flex-col gap-2 cursor-pointer"
          >
            <Copy />
          </div>
        </div>
      </div>
      <div className="bg-light-bg dark:bg-dark-bg flex flex-col w-full cursor-pointer" onClick={handleStepClick}>
        <div
          className={cn(
            'min-h-28 w-full hover:bg-light-btn-hover dark:hover:bg-dark-btn-hover',
            'flex flex-col justify-center rounded p-3',
            'border-b-2 border-light-border dark:border-dark-border',
            selectedStep?.stepIndex === stepIndex ? 'border-foreground' : 'border-light-bg-secondary',
          )}
        >
          <span className="font-semibold">{myScreen.title}</span>
          <p>
            {myScreen.description && myScreen.description.length > MAX_CHARS ? (
              <>
                <span className="text-xs">{myScreen.description.slice(0, MAX_CHARS)}... </span>
                <span className="text-xs">{t('action.see_more_label')}</span>
              </>
            ) : (
              myScreen.description
            )}
          </p>
          {myScreen.type === 'SERVICE' && myScreen.actions[0].actionType === StepActionType.AriesOob && (
            <>
              {!myScreen.actions[0].credentialDefinitionId || myScreen.actions[0].credentialDefinitionId === '' ? (
                <div className="bg-light-yellow mt-2 font-bold rounded gap-2 flex flex-row items-center justify-center">
                  <TriangleAlert size={22} />
                  {t('action.select_credential_label')}
                </div>
              ) : (
                <CredCard definitionId={myScreen.actions[0].credentialDefinitionId ?? ''} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
