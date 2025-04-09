import type { UseFormReturn } from 'react-hook-form'
import { useFieldArray, useFormContext } from 'react-hook-form'

import { FormTextInput } from '@/components/text-input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CredentialAttributeType } from '@/openapi-types'
import { CredentialAttributeTypeEnum } from '@/openapi-types'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

type FormData = {
  attributes: {
    name: string
    value: string
    type: 'STRING' | 'DATE'
  }[]
}

interface SchemaAttributesProps {
  mode: 'create' | 'view'
  form: UseFormReturn<FormData>
  attributes?: CredentialAttributeType[]
}
export const CredentialAttributes = ({ mode, form, attributes }: SchemaAttributesProps) => {
  const t = useTranslations()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'attributes',
  })
  const typeWatch = form.watch('attributes')

  if (mode === 'view' && attributes) {
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto w-full">
          {attributes.map((attr, index) => (
            <div key={attr.name || index} className="flex">
              <p className="w-1/2 text-sm text-foreground py-2 ">{attr.type || 'string'}</p>
              <p className="w-1/2 text-sm text-foreground py-2 ">{attr.name}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 py-3 border-b border-foreground/10">
        <label className="text-md font-bold">{t('credentials.add_attributes_label')}</label>
        <Button
          type="button"
          variant="outlineAction"
          size="sm"
          onClick={() =>
            append({
              name: '',
              value: '',
              type: CredentialAttributeTypeEnum.options[0],
            })
          }
        >
          {t('credentials.attributes_add_attribute_label')}
          <Plus className="w-4 h-4 text-foreground rounded-full border border-foreground/80" />
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const fieldType = typeWatch?.[index]?.type || 'STRING'

          return (
            <div key={field.id} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-bold mb-2 block text-foreground/80">
                  {t('credentials.attribute_type_label')}
                </label>
                <Select
                  onValueChange={(value) => {
                    form.setValue(`attributes.${index}.type`, value as typeof CredentialAttributeTypeEnum._type)
                  }}
                  defaultValue={field.type || 'STRING'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CredentialAttributeTypeEnum.options.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <FormTextInput
                  control={form.control}
                  name={`attributes.${index}.name`}
                  label={t('credentials.attribute_name_label')}
                  className="text-sm"
                  register={form.register}
                  error={form.formState.errors?.attributes?.[index]?.name?.message}
                  placeholder={fieldType === 'DATE' ? 'YYYYMMDD' : t('credentials.attribute_value_placeholder')}
                />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
