import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PREDICATE_OPTIONS } from '@/schemas/scenario'
import type { Attribute } from '@/types'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ProofAttributeProps {
  index: number
  attribute: string
  availableAttributes: Attribute[]
  currentValue: string
  onAttributeChange: (index: number, value: string) => void
  onConditionTypeChange: (index: number, value: string) => void
  onRemove: (index: number) => void
}

export const ProofAttribute = ({
  index,
  attribute,
  availableAttributes,
  currentValue,
  onAttributeChange,
  onConditionTypeChange,
  onRemove,
}: ProofAttributeProps) => {
  const t = useTranslations()
  return (
    <div className="grid grid-cols-5 gap-4 items-end">
      <div className="space-y-2">
        <label className="text-sm font-medium">Attribute</label>
        <Select
          onValueChange={(value) => {
            onAttributeChange(index, value as any)
          }}
          defaultValue={attribute}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('scenario.proof_attribute_placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {availableAttributes.map((attr) => (
              <SelectItem key={attr.name} value={attr.name}>
                {attr.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Attribute Value</label>
        <Input value={currentValue} disabled />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Condition</label>
        <Select value="none" onValueChange={(value) => onConditionTypeChange(index, value)}>
          <SelectTrigger>
            <SelectValue placeholder={t('scenario.proof_attribute_placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {PREDICATE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Condition Value</label>
        <Input disabled />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
