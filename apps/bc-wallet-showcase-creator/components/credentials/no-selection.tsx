import { Button } from '../ui/button'

export const NoSelection = ({
                              text,
                              subtext,
                              handleNewStep,
                              buttonText,
                              subtext1,
                              subtext2
                            }: {
  text: string
  subtext?: string
  subtext1?: string
  subtext2?: string
  handleNewStep?: () => void
  buttonText?: string
}) => {
  return (
    <div className="border border-light dark:border-dark w-full flex flex-col items-center justify-center h-full py-12 no-selection">
      <div className="mx-auto px-4 text-center">
          <h3 className="mb-3 text-base text-light-text dark:text-dark-text">{text}</h3>
          {subtext && <p className="text-base text-light-text dark:text-dark-text">{subtext}</p>}
          {subtext1 && <p className="mt-2 text-base text-light-text dark:text-dark-text">{subtext1}</p>}
          {subtext2 && <p className="mt-2 text-base text-light-text dark:text-dark-text">{subtext2}</p>}
          {handleNewStep && (
            <Button variant="outline" className="mt-4" onClick={handleNewStep}>
              {buttonText}
            </Button>
          )}
        </div>
      </div>
  )
}
