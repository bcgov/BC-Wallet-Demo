import type { Credential, Showcase } from './types'

import businessShowcase from '../../config/businessShowcase.json'
import credentialsConfig from '../../config/credentials.json'
import lawyerShowcase from '../../config/lawyerShowcase.json'
import studentShowcase from '../../config/studentShowcase.json'

const showcases: Showcase[] = [
  studentShowcase as unknown as Showcase,
  lawyerShowcase as unknown as Showcase,
  businessShowcase as unknown as Showcase,
]

export const allCredentials = credentialsConfig as unknown as (Credential & { _id: string })[]

export default showcases
