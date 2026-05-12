import type { Credential, Showcase } from './types'

import businessShowcase from '../../scripts/values/businessShowcase.json'
import credentialsConfig from '../../scripts/values/credentials.json'
import lawyerShowcase from '../../scripts/values/lawyerShowcase.json'
import studentShowcase from '../../scripts/values/studentShowcase.json'

const showcases: Showcase[] = [
  studentShowcase as unknown as Showcase,
  lawyerShowcase as unknown as Showcase,
  businessShowcase as unknown as Showcase,
]

export const allCredentials = credentialsConfig as unknown as (Credential & { _id: string })[]

export default showcases
