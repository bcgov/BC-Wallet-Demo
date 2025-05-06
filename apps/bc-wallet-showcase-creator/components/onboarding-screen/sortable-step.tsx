'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'
import { Copy, GripVertical, TriangleAlert } from 'lucide-react'
import { cn, baseUrl } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { Screen } from '@/types'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { StepRequest } from 'bc-wallet-openapi'
import { useTenant } from '@/providers/tenant-provider'

const MAX_CHARS = 50;

export const SortableStep = ({
  selectedStep,
  myScreen,
  stepIndex,
}: {
  selectedStep: StepRequest | null;
  myScreen: Screen;
  stepIndex: number;
}) => {
  const t = useTranslations();
  const { handleSelectStep, duplicateStep, activeScenarioIndex } = useOnboardingAdapter();
  const { tenantId } = useTenant();
  const itemId = myScreen.id || `step-${stepIndex}-${activeScenarioIndex}`;
  
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition,
    isDragging
  } = useSortable({ id: itemId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  const handleStepClick = () => {
    handleSelectStep(stepIndex - 1, activeScenarioIndex);
  };
  
  const handleCopyStep = (index: number) => {
    try {
      duplicateStep(index);
    } catch (error) {
      console.log("Error duplicating step:", error);
    }
  };

  const isSelected = selectedStep && selectedStep.order === stepIndex - 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-row items-center w-full bg-background min-h-28",
        isDragging ? "opacity-80 shadow-lg" : ""
      )}
    >
      <div
        className={`cursor-default h-full flex-shrink-0 flex items-center ${
          myScreen.type == 'SERVICE'
            ? "bg-yellow-500"
            : "bg-[#898A8A]"
        } px-3 py-5 rounded-l`}
      >
        <div className="flex flex-col gap-3">
          <div
            {...attributes}
            {...listeners}
            className="text-white text-2xl flex flex-col gap-2 cursor-grab active:cursor-grabbing"
            aria-label="Drag handle"
          >
            <GripVertical />
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              handleCopyStep(stepIndex - 1);
            }}
            className="text-white text-2xl flex flex-col gap-2 cursor-pointer"
          >
            <Copy />
          </div>
        </div>
      </div>
      <div
        className="bg-light-bg dark:bg-dark-bg flex flex-col w-full cursor-pointer"
        onClick={handleStepClick}
      >
        <div
          className={cn(
            "min-h-28 w-full hover:bg-light-btn-hover dark:hover:bg-dark-btn-hover",
            "flex flex-col justify-center rounded p-3",
            "border-b-2 border-light-border dark:border-dark-border",
            isSelected
              ? "border-foreground"
              : "border-light-bg-secondary"
          )}
        >
          <span className="font-semibold">{myScreen.title}</span>
          <p>
            {myScreen.description && myScreen.description.length > MAX_CHARS ? (
              <>
                <span className="text-xs">
                  {myScreen.description.slice(0, MAX_CHARS)}...{" "}
                </span>
                <span className="text-xs">{t("action.see_more_label")}</span>
              </>
            ) : (
              myScreen.description
            )}
          </p>
          {myScreen.type === 'SERVICE' && (
            <>
              {(!myScreen.credentials || myScreen.credentials.length === 0) ? (
                <div className="bg-light-yellow mt-2 font-bold rounded gap-2 flex flex-row items-center justify-center">
                  <TriangleAlert size={22} />
                  {t('action.select_credential_label')}
                </div>
              ) : (
                myScreen.credentials?.map((cred, index) => (
                  <div
                    key={cred.id ?? index}
                    className="bg-background p-2 flex mt-2 rounded"
                  >
                    <Image
                      src={
                        cred.icon?.id
                          ? `${baseUrl}/${tenantId}/assets/${cred.icon.id}/file`
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
                      className="rounded-full"
                    />
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
  );
};