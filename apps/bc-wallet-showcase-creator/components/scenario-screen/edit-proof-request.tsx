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
          restrictions: [],
        }
      },
      predicates: {
        [credentialName]: {
          predicates: [],
        }
      }
    }
  })

  useEffect(() => {
    if (!currentStep || !cred?.credentialDefinition) return

    const action = currentStep.actions?.[0]
    if (!action || action.actionType !== StepActionType.AriesOob || !action.proofRequest) return

    const currentAttributes = action.proofRequest.attributes?.[credentialName]?.attributes || []
    const currentPredicates = action.proofRequest.predicates?.[credentialName]?.predicates || []

    form.reset({
      attributes: {
        [credentialName]: {
          attributes: currentAttributes,
          restrictions: [credentialName]
        }
      },
      predicates: {
        [credentialName]: {
          predicates: currentPredicates.map(pred => ({
            name: pred.name,
            type: pred.type as ">=" | "<=" | "=" | "none",
            value: pred.value,
            restrictions: [credentialName]
          }))
        },

      }

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
    // Get both attributes and predicates
    const currentAttributes = form.getValues(`attributes.${credentialName}.attributes`) || []
    const currentPredicates = form.getValues(`predicates.${credentialName}.predicates`) || []

    // Get the attribute name from the combined list
    const attributeList = [
      ...currentAttributes,
      ...currentPredicates.map(p => p.name)
    ]
    const attribute = attributeList[index]

    if (!attribute) return

    if (value === 'none') {
      // Remove from predicates
      const newPredicates = currentPredicates.filter(pred => pred.name !== attribute)
      form.setValue(`predicates.${credentialName}.predicates`, newPredicates, { shouldDirty: true })

      // Add back to attributes if not present
      if (!currentAttributes.includes(attribute)) {
        form.setValue(`attributes.${credentialName}.attributes`, [...currentAttributes, attribute], {
          shouldDirty: true
        })
      }
    } else {
      // Remove from attributes list
      const newAttributes = currentAttributes.filter(attr => attr !== attribute)
      form.setValue(`attributes.${credentialName}.attributes`, newAttributes, {
        shouldDirty: true
      })

      // Create predicate object
      const allowedTypes = ['>=', '<=', '=', 'none'] as const
      const predicateType: '>=' | '<=' | '=' | 'none' =
        allowedTypes.includes(value as any) ? (value as '>=' | '<=' | '=' | 'none') : 'none'

      const predicate = {
        name: attribute,
        type: predicateType,
        value: 0,
        restrictions: [credentialName]
      }

      // Add/Update predicate
      const existingPredicateIndex = currentPredicates.findIndex(p => p.name === attribute)
      if (existingPredicateIndex !== -1) {
        currentPredicates[existingPredicateIndex] = predicate
      } else {
        currentPredicates.push(predicate)
      }

      form.setValue(`predicates.${credentialName}.predicates`, currentPredicates, {
        shouldDirty: true,
        shouldValidate: true
      })
    }

    // Force form update
    form.trigger()
  }

  // Add handleConditionValueChange function
  const handleConditionValueChange = (index: number, value: string) => {
    const currentAttributes = form.getValues(`attributes.${credentialName}.attributes`) || []
    const currentPredicates = form.getValues(`predicates.${credentialName}.predicates`) || []

    const attributeList = [
      ...currentAttributes,
      ...currentPredicates.map(p => p.name)
    ]
    const attribute = attributeList[index]

    if (!attribute) return

    const existingPredicateIndex = currentPredicates.findIndex(p => p.name === attribute)
    if (existingPredicateIndex === -1) return

    const updatedPredicates = [...currentPredicates]
    updatedPredicates[existingPredicateIndex] = {
      ...currentPredicates[existingPredicateIndex],
      value: parseFloat(value) || 0
    }

    form.setValue(`predicates.${credentialName}.predicates`, updatedPredicates, {
      shouldDirty: true,
      shouldValidate: true
    })

    // Force form update
    form.trigger()
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
      form.setValue(`attributes.${credentialName}.restrictions`, [credentialName], {
        shouldDirty: true
      })
    }
  }

  const handleRemoveAttribute = (index: number) => {
    const currentAttributes = form.getValues(`attributes.${credentialName}.attributes`) || []
    const currentPredicates = form.getValues(`predicates.${credentialName}.predicates`) || []

    // Get the attribute name from the combined list
    const attributeList = [
      ...currentAttributes,
      ...currentPredicates.map(p => p.name)
    ]
    const attributeName = attributeList[index]

    if (!attributeName) return

    // Remove from attributes if present
    const newAttributes = currentAttributes.filter(attr => attr !== attributeName)
    form.setValue(`attributes.${credentialName}.attributes`, newAttributes, {
      shouldDirty: true
    })

    // Remove from predicates if present
    const newPredicates = currentPredicates.filter(p => p.name !== attributeName)
    form.setValue(`predicates.${credentialName}.predicates`, newPredicates, {
      shouldDirty: true
    })
  }

  const onSubmit = () => {
    if (!currentStep || !currentStep.actions || currentStep.actions.length === 0) return

    const formData = form.getValues()

    setEditingCredentials(editingCredentials.filter((i) => i !== editingIndex))

    const updatedStep: StepRequest = {
      ...currentStep,
      //@ts-ignore
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

  const formValues = form.watch();

  const attributeList = [
    ...(formValues.attributes?.[credentialName]?.attributes || []),
    ...(formValues.predicates?.[credentialName]?.predicates || []).map(p => p.name)
  ];

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
              predicates={formValues.predicates?.[credentialName]?.predicates}
              onAttributeChange={handleAttributeChange}
              onConditionTypeChange={handleConditionTypeChange}
              onConditionValueChange={handleConditionValueChange}
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
          disabled={availableAttributes.length === 0 || attributeList.length >= availableAttributes.length}
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