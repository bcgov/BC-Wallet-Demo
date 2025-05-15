'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { usePresentationAdapter } from "@/hooks/use-presentation-adapter"
import { Button } from "@/components/ui/button"

export function PresentationState() {
  const { steps, scenarios } = usePresentationAdapter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Presentation State</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <h2>Scenarios</h2>
          {scenarios.map((scenario, idx) => (
            <div key={idx}>{scenario.name} - {scenario.description}</div>
          ))}
        </div>
        <div>
          <h2>Steps</h2>
          {steps.map((step, idx) => (
            <div key={idx}>{step.title} - {step.type} - {step.description}</div>
          ))}
        </div>
      </CardContent>
      <CardFooter>  
        <Button onClick={() => {}}>Reset</Button>
      </CardFooter>
    </Card>
  )
}
  
