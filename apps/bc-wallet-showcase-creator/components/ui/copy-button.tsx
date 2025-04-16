'use client'

import * as React from 'react'

import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckIcon, ClipboardIcon } from 'lucide-react'

interface CopyButtonProps extends ButtonProps {
  value: string
}

export function CopyButton({ value, className, variant = 'ghost', ...props }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false)
    }, 2000)
  }, [hasCopied])

  return (
    <Button
      size="icon"
      variant={variant}
      className={cn(
        'relative z-10 h-8 w-8 text-zinc-50 hover:bg-zinc-700 hover:text-zinc-50 [&_svg]:h-4 [&_svg]:w-4',
        className
      )}
      onClick={() => {
        navigator.clipboard.writeText(value)
        setHasCopied(true)
      }}
      {...props}
    >
      <span className="sr-only">Copy</span>
      {hasCopied ? <CheckIcon /> : <ClipboardIcon />}
    </Button>
  )
}
