import { Step } from '../types'

export const sortSteps = (steps: Step[]) => {
  return steps?.sort((a, b) => a.order - b.order)
}
