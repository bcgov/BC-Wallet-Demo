import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { cn, baseUrl } from '@/lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CredentialDefinition, StepRequest } from 'bc-wallet-openapi'
import { Copy, GripVertical, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Screen } from '@/types'

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

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: myScreen.id || `step-${scenarioIndex}-${stepIndex}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

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
            'min-h-28 w-full hover:bg-light-btn-hover dark:hover:bg-dark-btn-hover',
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
              {(!myScreen.credentials || myScreen.credentials.length === 0) ? (
                <>
                <div className="bg-light-yellow mt-2 font-bold rounded gap-2 flex flex-row items-center justify-center">
                  <TriangleAlert size={22} />
                  {t('action.select_credential_label')}
                </div>
                </>
              ) : (
                myScreen.credentials.map((cred: CredentialDefinition, index:number) => (
                  <div
                    key={cred.id ?? index}
                    className="bg-white dark:bg-dark-bg-secondary p-2 flex mt-2 rounded"
                  >
                    <Image
                      src={
                        cred?.icon?.id
                          ? `${baseUrl}/assets/${cred.icon.id}/file`
                          : '/assets/no-image.jpg'
                      }
                      unoptimized
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement
                        target.src = '/assets/no-image.jpg'
                      }}
                      alt={'Credential Icon'}
                      width={50}
                      height={50}
                      className="rounded-full object-cover"
                    />
                    {/* <div className="ml-4 flex-col">
                      <div className="font-semibold">{cred.name}</div>
                      <div className="text-sm">{cred.issuer?.name ?? 'Test college'}</div>
                    </div> */}
                    <div className="align-middle ml-auto text-right">
                      <div className="font-semibold">{t('credentials.attributes_label')}</div>
                      <div className="text-sm text-end">
                        {cred.credentialSchema?.attributes?.length ?? 0}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
