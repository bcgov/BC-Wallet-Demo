'use client'

import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ProofRequestFormData } from '@/schemas/scenario'
import { proofRequestSchema } from '@/schemas/scenario'
import type { ProofRequest, ShowcaseJSON } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'

import { ProofAttribute } from './proof-attribute'
import { CredentialDefinitionType, StepRequestType } from '@/openapi-types'
import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'

interface StepWithCredentials extends StepRequestType {
  credentials?: string[];
}

interface EditProofRequestProps {
  showcaseJSON?: ShowcaseJSON
  credentials: CredentialDefinitionType;
  updateCredentials?:(updatedCredentials: ProofRequestFormData) => void;
  proofRequest?: ProofRequest
  credentialName: string
  selectedCharacter?: number
  selectedScenario: number
  selectedStep: number
  setEditingCredentials: (editingCredentials: number[]) => void
  editingCredentials: number[]
  editingIndex: number
}

export const EditProofRequest = ({
  showcaseJSON,
  proofRequest,
  credentialName,
  selectedCharacter,
  setEditingCredentials,
  editingCredentials,
  editingIndex,
  updateCredentials,
  credentials
}: EditProofRequestProps) => {
  const form = useForm<ProofRequestFormData>({
    resolver: zodResolver(proofRequestSchema),
  })

  const {selectedScenario, updateStep,selectedStep, setStepState } = usePresentationAdapter()
  const currentStep = selectedScenario && selectedStep !== null ? selectedScenario.steps[selectedStep.stepIndex] as StepWithCredentials : null
  
  const availableAttributes = (credentials.credentialSchema?.attributes || []).map(attr => ({
    ...attr,
    value: attr.value || ''
  }))

  const handleAttributeChange = (index: number, value: string) => {
    const currentAttributes = form.getValues(`attributes.${credentialName}.attributes`) || []
    const newAttributes = [...currentAttributes]
    newAttributes[index] = value
    form.setValue(`attributes.${credentialName}.attributes`, newAttributes, {
      shouldValidate: true,
      shouldDirty: true,
    })
    if (updateCredentials) {
      const formValues = form.getValues();
      const updatedStep = structuredClone(currentStep);
  
      if (
        updatedStep?.actions?.[0]?.proofRequest?.attributes &&
        updatedStep.actions[0].proofRequest.attributes[credentialName]
      ) {
        updatedStep.actions[0].proofRequest.attributes[credentialName].attributes = newAttributes;
      }
  
      updateCredentials({
        ...formValues,
        attributes: formValues.attributes,
        predicates: formValues.predicates,
      });
    }
  }

  const handleConditionTypeChange = (index: number, value: string) => {
    const currentAttributes = form.getValues(`attributes.${credentialName}.attributes`) || []
    const attribute = currentAttributes[index]

    if (value === 'none') {
      const predicates = form.getValues('predicates') || {}
      const predicateKey = Object.keys(predicates).find((key) => predicates[key].name === attribute)
      if (predicateKey) {
        const newPredicates = { ...predicates }
        delete newPredicates[predicateKey]
        form.setValue('predicates', newPredicates)
      }
    } else {
      const newPredicateKey = `${Date.now()}`
      form.setValue(`predicates.${newPredicateKey}`, {
        name: attribute,
        type: value as '>=',
        value: 0,
        restrictions: [credentialName],
      })
      const newAttributes = currentAttributes.filter((_, i) => i !== index)
      form.setValue(`attributes.${credentialName}.attributes`, newAttributes)
    }
  }

  const handleAddAttribute = () => {
    const currentAttributes = form.getValues(`attributes.${credentialName}.attributes`) || []
    const defaultAttribute = availableAttributes[0]?.name
    if (defaultAttribute) {
      form.setValue(`attributes.${credentialName}.attributes`, [...currentAttributes, defaultAttribute])
    }
  }

  const handleRemoveAttribute = (index: number) => {
    const currentAttributes = form.getValues(`attributes.${credentialName}.attributes`) || []
    const newAttributes = currentAttributes.filter((_, i) => i !== index)
    form.setValue(`attributes.${credentialName}.attributes`, newAttributes)
  }

  const onSubmit = (data: ProofRequestFormData) => {
    setEditingCredentials(editingCredentials.filter((i) => i !== editingIndex))

    if (!currentStep || !currentStep.actions || currentStep.actions.length === 0) return;

    const updatedStep = {
      ...currentStep,
      actions: currentStep.actions.map((action, index) => {
        if (index !== 0) return action;
  
        return {
          ...action,
          proofRequest: {
            ...action.proofRequest,
            attributes: form.getValues().attributes,
            predicates:{}
          }
        };
      }),
    };

    updateStep(selectedStep?.stepIndex || 0, updatedStep);
  }  

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {availableAttributes.map((attribute, index) => (
          <ProofAttribute
            key={`${attribute}_${index}`}
            index={index}
            attribute={attribute}
            availableAttributes={availableAttributes}
            currentValue={attribute.value || ''}
            onAttributeChange={handleAttributeChange}
            onConditionTypeChange={handleConditionTypeChange}
            onRemove={handleRemoveAttribute}
          />
        ))}
      </div>

      <div className={cn('flex flex-wrap gap-4', 'justify-between items-center', 'pt-4 border-t border-border')}>
        <Button type="button" variant="outline" onClick={()=>handleAddAttribute()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Attribute
        </Button>

        <Button type="submit" disabled={!form.formState.isDirty} onClick={() => onSubmit(form.getValues())} className="gap-2">
          Save Changes
        </Button>
      </div>
    </div>
  )
}
