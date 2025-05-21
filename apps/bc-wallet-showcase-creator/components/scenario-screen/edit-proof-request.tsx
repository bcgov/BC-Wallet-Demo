'use client'

import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ProofRequestFormData } from '@/schemas/scenario'
import { proofRequestSchema } from '@/schemas/scenario'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'

import { ProofAttribute } from './proof-attribute'
import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { StepActionType, StepRequest } from 'bc-wallet-openapi'
import { StepRequestUIActionTypes } from '@/lib/steps'
import { useCredentialDefinition } from '@/hooks/use-credentials'
import { Skeleton } from '@/components/ui/skeleton'

interface EditProofRequestProps {
  credentialId: string;
  updateCredentials?: (updatedCredentials: ProofRequestFormData) => void;
  selectedScenario: number
  selectedStep: number
  setEditingCredentials: (editingCredentials: number[]) => void
  editingCredentials: number[]
  editingIndex: number
}

export const EditProofRequest = ({
                                   setEditingCredentials,
                                   editingCredentials,
                                   editingIndex,
                                   updateCredentials,
                                   credentialId
                                 }: EditProofRequestProps) => {
  const { data: cred, isLoading } = useCredentialDefinition(credentialId)
  const { selectedScenario, updateStep, selectedStep } = usePresentationAdapter()

  const currentStep = selectedScenario && selectedStep !== null
    ? selectedScenario.steps[selectedStep.stepIndex] as StepRequestUIActionTypes
    : null

  const credentialName = cred?.credentialDefinition?.credentialSchema?.name || 'credential'

  const availableAttributes = (cred?.credentialDefinition?.credentialSchema?.attributes || []).map(attr => ({
    ...attr,
    value: attr.value || ''
  }))

  const form = useForm<ProofRequestFormData>({
    resolver: zodResolver(proofRequestSchema),
    defaultValues: {
      attributes: {
        [credentialName]: {
          attributes: [],
          restrictions: []
        }
      },
      predicates: {}
    }
  })

  useEffect(() => {
    if (!currentStep || !cred?.credentialDefinition) return

    const action = currentStep.actions?.[0]
    if (!action || action.actionType !== StepActionType.AriesOob || !action.proofRequest) return

    const currentAttributes = action.proofRequest.attributes?.[credentialName]?.attributes || []
    const currentPredicates = action.proofRequest.predicates || undefined

    form.reset({
      attributes: {
        [credentialName]: {
          attributes: currentAttributes,
          restrictions: [credentialName]
        }
      },
    })
  }, [currentStep, cred, credentialName, form])

  const handleAttributeChange = (index: number, value: string) => {
    const currentAttributes = form.getValues(`attributes.${credentialName}.attributes`) || []
    const newAttributes = [...currentAttributes]

    while (newAttributes.length <= index) {
      newAttributes.push('')
    }

    newAttributes[index] = value

    form.setValue(`attributes.${credentialName}.attributes`, newAttributes, {
      shouldValidate: true,
      shouldDirty: true,
    })

    form.setValue(`attributes.${credentialName}.restrictions`, [credentialName], {
      shouldValidate: true,
    })

    if (updateCredentials) {
      const formValues = form.getValues()
      updateCredentials({
        ...formValues,
        attributes: {
          ...formValues.attributes,
          [credentialName]: {
            attributes: newAttributes,
            restrictions: [credentialName]
          }
        },
        predicates: formValues.predicates,
      })
    }
  }

  const handleConditionTypeChange = (index: number, value: string) => {
    const currentAttributes = form.getValues(`attributes.${credentialName}.attributes`) || []
    if (!currentAttributes[index]) return

    const attribute = currentAttributes[index]

    if (value === 'none') {
      const predicates = form.getValues('predicates') || {}
      const predicateKey = Object.keys(predicates).find((key) => predicates[key].name === attribute)
      if (predicateKey) {
        const newPredicates = { ...predicates }
        delete newPredicates[predicateKey]
        form.setValue('predicates', newPredicates, { shouldDirty: true })
      }
    } else {
      form.setValue(`predicates.${attribute}`, {
        name: attribute,
        type: value as '>=',
        value: 0,
        restrictions: [credentialName],
      }, { shouldDirty: true })

      const newAttributes = currentAttributes.filter((_, i) => i !== index)
      form.setValue(`attributes.${credentialName}.attributes`, newAttributes, { shouldDirty: true })
    }
  }

  const handleAddAttribute = () => {
    if (availableAttributes.length === 0) return

    const currentAttributes = form.getValues(`attributes.${credentialName}.attributes`) || []
    const usedAttributes = new Set(currentAttributes)

    const defaultAttribute = availableAttributes.find(attr => !usedAttributes.has(attr.name))?.name

    if (defaultAttribute) {
      form.setValue(`attributes.${credentialName}.attributes`, [...currentAttributes, defaultAttribute], {
        shouldDirty: true
      })
    }
  }

  const handleRemoveAttribute = (index: number) => {
    const currentAttributes = form.getValues(`attributes.${credentialName}.attributes`) || []
    const newAttributes = currentAttributes.filter((_, i) => i !== index)
    form.setValue(`attributes.${credentialName}.attributes`, newAttributes, {
      shouldDirty: true
    })
  }

  const onSubmit = () => {
    if (!currentStep || !currentStep.actions || currentStep.actions.length === 0) return

    const formData = form.getValues()

    setEditingCredentials(editingCredentials.filter((i) => i !== editingIndex))

    const updatedStep: StepRequest = {
      ...currentStep,
      actions: currentStep.actions.map((action, index) => {
        if (index !== 0) return action

        return {
          ...action,
          proofRequest: {
            ...action.proofRequest,
            attributes: formData.attributes,
            predicates: formData.predicates,
          },
          credentialDefinitionId: credentialId
        }
      }),
    }

    updateStep(selectedStep?.stepIndex || 0, updatedStep)
  }

  if (isLoading) {
    return <Skeleton className="w-full h-full" />
  }

  const attributeList = form.watch(`attributes.${credentialName}.attributes`) || []

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {attributeList.length > 0 ? (
          attributeList.map((attributeName, index) => (
            <ProofAttribute
              key={`${attributeName}_${index}`}
              index={index}
              attribute={availableAttributes.find(attr => attr.name === attributeName) || {
                name: attributeName,
                type: 'STRING',
                value: '',
                id: `temp_${attributeName}`,
                createdAt: new Date(),
                updatedAt: new Date()
              }}
              availableAttributes={availableAttributes}
              currentValue={attributeName}
              onAttributeChange={handleAttributeChange}
              onConditionTypeChange={handleConditionTypeChange}
              onRemove={handleRemoveAttribute}
            />
          ))
        ) : (
          <div className="text-center p-4 text-muted-foreground">
            No attributes selected. Click "Add Attribute" to begin.
          </div>
        )}
      </div>

      <div className={cn('flex flex-wrap gap-4', 'justify-between items-center', 'pt-4 border-t border-border')}>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddAttribute}
          className="gap-2"
          disabled={availableAttributes.length === 0}
        >
          <Plus className="h-4 w-4" />
          Add Attribute
        </Button>

        <Button
          type="button"
          disabled={attributeList.length == 0}
          onClick={onSubmit}
          className="gap-2"
        >
          Save Changes
        </Button>
      </div>
    </div>
  )
}