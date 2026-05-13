import type { ShowcaseStatus } from '../../types'

export const STATUS_CONFIG: Record<ShowcaseStatus, { bgColor: string; textColor: string; label: string }> = {
  active: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    label: 'Active',
  },
  pending: {
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    label: 'Pending',
  },
  hidden: {
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    label: 'Hidden',
  },
}

interface StatusBadgeProps {
  status: ShowcaseStatus | undefined
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status || !(status in STATUS_CONFIG)) return null

  const config = STATUS_CONFIG[status]

  return (
    <span className={`inline-block ${config.bgColor} ${config.textColor} text-xs font-semibold px-2 py-1 rounded`}>
      {config.label}
    </span>
  )
}
