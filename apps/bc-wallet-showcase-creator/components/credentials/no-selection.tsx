import { Button } from '../ui/button'

export const NoSelection = ({
  text,
  subtext,
  handleNewStep,
  buttonText,
}: {
  text: string
  subtext?: string
  handleNewStep?: () => void
  buttonText?: string
}) => {
  return (
    <div className="border border-light dark:border-dark w-full flex items-center justify-center no-selection">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="mb-2 text-lg font-medium">{text}</h3>
          {subtext && <p className="text-gray-500">{subtext}</p>}
          {handleNewStep && (
            <Button variant="outline" className="mt-4" onClick={handleNewStep}>
              {buttonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
