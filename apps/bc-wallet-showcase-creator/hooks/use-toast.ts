import { toast as sonnerToast } from 'sonner'

export interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export function useToast() {
  const toast = ({ title, description, variant, duration }: ToastOptions) => {
    // Build the message with both title and description if available
    let message = ''
    if (title && description) {
      message = `${title}: ${description}`
    } else if (title) {
      message = title
    } else if (description) {
      message = description
    }

    if (variant === 'destructive') {
      sonnerToast.error(message, { duration })
    } else {
      sonnerToast.success(message, { duration })
    }
  }

  return { toast }
}
