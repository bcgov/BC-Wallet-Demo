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

interface EditProofRequestProps {
  showcaseJSON: ShowcaseJSON
  proofRequest: ProofRequest
  credentialName: string
  selectedCharacter: number
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
}: EditProofRequestProps) => {
  const form = useForm<ProofRequestFormData>({
    resolver: zodResolver(proofRequestSchema),
    defaultValues: proofRequest as ProofRequestFormData,
  })

  const availableAttributes = showcaseJSON.personas[selectedCharacter].credentials[credentialName].attributes

  const handleAttributeChange = (index: number, value: string) => {
    const currentAttributes = form.getValues(`attributes.${credentialName}.attributes`) || []
    const newAttributes = [...currentAttributes]
    newAttributes[index] = value
    form.setValue(`attributes.${credentialName}.attributes`, newAttributes, {
      shouldValidate: true,
      shouldDirty: true,
    })
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
  }

  const attributes = form.watch(`attributes.${credentialName}.attributes`) || []

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {attributes.map((attribute, index) => (
          <ProofAttribute
            key={`${attribute}_${index}`}
            index={index}
            attribute={attribute}
            availableAttributes={availableAttributes}
            currentValue={availableAttributes.find((a) => a.name === attribute)?.value || ''}
            onAttributeChange={handleAttributeChange}
            onConditionTypeChange={handleConditionTypeChange}
            onRemove={handleRemoveAttribute}
          />
        ))}
      </div>

      <div className={cn('flex flex-wrap gap-4', 'justify-between items-center', 'pt-4 border-t border-border')}>
        <Button type="button" variant="outline" onClick={handleAddAttribute} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Attribute2
        </Button>

        <Button type="submit" disabled={!form.formState.isDirty}>
          Save Changes
        </Button>
      </div>
    </form>
  )
}
