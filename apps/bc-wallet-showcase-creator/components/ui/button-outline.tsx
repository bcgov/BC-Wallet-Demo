import * as React from 'react'

import { cn } from '@/lib/utils'
import { Button } from './button'
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const ButtonOutline: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <Button
      className={cn(
        'border-2 border-dark-border dark:border-dark-border cursor-pointer uppercase dark:bg-dark-tertiary text-light-text dark:text-dark-text hover:bg-light-btn dark:hover:bg-dark-btn-hover font-bold py-2 px-2 rounded-md transition',
        className,
        'bg-white dark:bg-dark-bg-tertiary'
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

export default ButtonOutline
