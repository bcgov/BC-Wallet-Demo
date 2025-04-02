import { useCredentials } from '@/hooks/use-credentials-store'
import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { cn, baseUrl } from '@/lib/utils'
import type { StepType } from '@/openapi-types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

const MAX_CHARS = 50

export const SortableStep = ({
  selectedStep,
  myScreen,
  stepIndex,
  scenarioIndex,
  totalSteps,
}: {
  selectedStep: { stepIndex: number, scenarioIndex: number } | null
  myScreen: StepType
  stepIndex: number
  totalSteps: number
  scenarioIndex: number
}) => {
  const t = useTranslations()
  const { handleSelectStep, duplicateStep, activePersonaId, setSelectedStep, setStepState, activeScenarioIndex, setActiveScenarioIndex } = usePresentationAdapter()
  const {setSelectedScenario} = useScenarios()
  const { selectedCredential } = useCredentials()

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: myScreen.id || `step-${scenarioIndex}-${stepIndex}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

const handleStepClick = () => {
  const ScreenType = myScreen.type;

  console.log('Step clicked!', { 
    stepIndex, 
    scenarioIndex,
    myScreen: {
      type: myScreen.type,
      title: myScreen.title
    }
  });
  
  switch (ScreenType) {
    case 'HUMAN_TASK':
      setStepState('editing-basic')
      break;
    case 'SERVICE':
      setStepState('editing-issue')
  }
  handleSelectStep(stepIndex, scenarioIndex)
  // setStepState('editing-issue');

  if (activeScenarioIndex !== scenarioIndex) {
    setActiveScenarioIndex(scenarioIndex);
  }
  // setSelectedScenario(stepIndex);
};

  const handleCopyStep = (stepIndex: number, scenarioIndex: number) => {
    try {
      console.log('Duplicating step:', { stepIndex, scenarioIndex })

      if (!activePersonaId) {
        console.error('Cannot duplicate - no active persona')
        return
      }

      duplicateStep(stepIndex)

      handleSelectStep(stepIndex + 1, scenarioIndex)
    } catch (error) {
      console.error('Error duplicating step:', error)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex mb-2 flex-row items-center w-full bg-white dark:bg-dark-bg-secondary min-h-28"
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
            'min-h-28  w-full hover:bg-light-btn-hover dark:hover:bg-dark-btn-hover',
            'flex flex-col justify-center rounded p-3',
            'border-b-2 border-light-border dark:border-dark-border',
            selectedStep?.stepIndex === stepIndex ? 'border-foreground' : 'border-light-bg-secondary',
          )}
        >
          <span className="font-semibold">{myScreen.title}</span>
          <p>
            {myScreen.description.length > MAX_CHARS ? (
              <>
                <span className="text-xs">{myScreen.description.slice(0, MAX_CHARS)}... </span>
                <span className="text-xs">{t('action.see_more_label')}</span>
              </>
            ) : (
              myScreen.description
            )}
          </p>
          {myScreen.type == 'SERVICE' && (
            <>
              {!selectedCredential ? (
                <>{/* Optional warning message could go here */}</>
              ) : (
                <>
                  {selectedCredential && (
                    <div className="bg-white dark:bg-dark-bg-secondary p-2 flex">
                      <Image
                        src={
                          selectedCredential.icon?.id
                            ? `${baseUrl}/assets/${selectedCredential.icon.id}/file`
                            : '/assets/no-image.jpg'
                        }
                        alt={selectedCredential.icon?.description || 'Credential'}
                        width={50}
                        height={50}
                        className="rounded-full"
                      />
                      <div className="ml-4 flex-col">
                        <div className="font-semibold">{selectedCredential?.name}</div>
                        {/* <div className="text-sm">{selectedCredential?.relyingParty?.name ?? 'Test college'}</div> */}
                      </div>
                      <div className="align-middle ml-auto">
                        <div className="font-semibold">Attributes</div>
                        {/* <div className="text-sm text-end">{Object.keys(selectedCredential.credentialSchema.attributes).length}</div> */}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
