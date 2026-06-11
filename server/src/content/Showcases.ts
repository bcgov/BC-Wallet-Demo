import type { CreateCredentialInput, Showcase } from './types'

import businessShowcase from '../../migrations/values/businessShowcase.json'
import credentialsConfig from '../../migrations/values/credentials.json'
import lawyerShowcase from '../../migrations/values/lawyerShowcase.json'
import studentShowcase from '../../migrations/values/studentShowcase.json'

const showcases: Showcase[] = [
  studentShowcase as unknown as Showcase,
  lawyerShowcase as unknown as Showcase,
  businessShowcase as unknown as Showcase,
]

export const allCredentials = credentialsConfig as unknown as (CreateCredentialInput & { _id: string })[]

export default showcases
