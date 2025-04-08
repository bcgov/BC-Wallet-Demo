import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'   
import { useTranslations } from 'next-intl'

export function ConfirmationDialog({
  title,
  content,
  buttonLabel,
  onSubmit,
  disabled,
}: {
  title: string
  content: React.ReactNode
  buttonLabel: string
  onSubmit: () => void
  disabled?: boolean
}) {
  const t = useTranslations()
  
  return (
    <AlertDialog>
      <AlertDialogTrigger
        disabled={disabled}
        className="px-6 bg-yellow-500 py-2 rounded text-gray-700 font-bold hover:bg-yellow-400 dark:bg-yellow-500 dark:hover:bg-yellow-600"
      >
        {buttonLabel}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{content}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('action.cancel_label')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-yellow-500 border-light-yellow hover:bg-yellow-500"
            onClick={() => {
              onSubmit()
            }}
          >
            {buttonLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
