import { useTranslations } from "next-intl"

export const Instructions = () => {
  const t = useTranslations()
  
  return (
    <div className="w-1/3 bg-background border shadow-md rounded-md flex flex-col">
    <div className="p-4 border-b shadow">
      <h2 className="text-lg underline font-bold text-foreground">How to create a showcase</h2>
      <p className="w-full text-sm text-foreground/80 mt-2">
        The information below will walk you through each step of building your showcase. Please review the details of each section before beginning.
      </p>
    </div>
    <div className="p-4">
      <ul className="flex flex-col gap-4">
        <li className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Section 1: General</h3>
          <p className="text-xs text-foreground/80">This is the first step to create a showcase.</p>
        </li>
        <li className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Section 2: Character</h3>
          <p className="text-xs text-foreground/80">Create and configure the characters that will be used in your showcase.</p>
        </li>
        <li className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Section 3: Onboarding</h3>
          <p className="text-xs text-foreground/80">This section includes multiple steps to create your character onboarding. First, you will review and configure each of the default onboarding steps already included in your showcase. Next, you will add any additional steps you would like to include in the character onboarding.</p>
        </li>
        <li className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Section 4: Scenario</h3>
          <p className="text-xs text-foreground/80">This section includes multiple steps to create the scenarios included in your showcase. First, you will review and configure each of the default scenario steps already included in your showcase. Next, you will add and configure those steps required to verify credentials held by each character.</p>
        </li>
        <li className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Section 5: Publish</h3>
          <p className="text-xs text-foreground/80">Your showcase is now ready to publish. After publishing, your showcase is ready for use!</p>
        </li>
      </ul>
    </div>
  </div>
  )
}
