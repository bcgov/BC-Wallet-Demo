import { useTranslations } from "next-intl"

export const Instructions = () => {
  const t = useTranslations()
  
  return (
    <div className="w-1/3 bg-[white] dark:bg-dark-bg-secondary border shadow-md rounded-md flex flex-col">
    <div className="p-4 border-b shadow">
      <h2 className="text-base font-bold text-foreground">How to create a showcase</h2>
      <p className="w-full text-xs text-foreground/80">
        This is a step by step guide to help you create a showcase.
      </p>
    </div>
    <div className="p-4">
      <ul className="flex flex-col gap-4">
        <li className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">Step 1: Give a name to your showcase</h3>
          <p className="text-xs text-foreground/80">This is the first step to create a showcase.</p>
        </li>
        <li className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">Step 2: Create a persona</h3>
          <p className="text-xs text-foreground/80">This is the first step to create a showcase.</p>
        </li>
        <li className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">Step 3: Create the onboarding</h3>
          <p className="text-xs text-foreground/80">This is the first step to create a showcase.</p>
        </li>
        <li className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">Step 4: Add steps to the onboarding</h3>
          <p className="text-xs text-foreground/80">This is the first step to create a showcase.</p>
        </li>
        <li className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">Step 5: Create a scenario</h3>
          <p className="text-xs text-foreground/80">This is the first step to create a showcase.</p>
        </li>
        <li className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">Step 6: Add steps to the scenario</h3>
          <p className="text-xs text-foreground/80">This is the first step to create a showcase.</p>
        </li>
        <li className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">Step 7: Submit your showcase</h3>
          <p className="text-xs text-foreground/80">Submit your showcase for review.</p>
        </li>
      </ul>
    </div>
  </div>
  )
}
