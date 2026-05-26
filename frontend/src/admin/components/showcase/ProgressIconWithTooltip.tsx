import type { ProgressBarStep } from '../../types'

import { publicBaseUrl } from '../../api/adminApi'

interface ProgressIconWithTooltipProps {
  progressStep: ProgressBarStep | null | undefined
  tooltipText?: string
}

export function ProgressIconWithTooltip({
  progressStep,
  tooltipText = 'This icon will show in the Introduction progress bar. Edit screen to change icon.',
}: ProgressIconWithTooltipProps) {
  if (!progressStep) {
    return <div className="w-12 h-12" />
  }

  return (
    <div className="relative group">
      <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-bcgov-blue bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors">
        <img src={`${publicBaseUrl}${progressStep.iconLight}`} alt={progressStep.name} className="w-6 h-6" />
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-bcgov-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {tooltipText}
      </div>
    </div>
  )
}
