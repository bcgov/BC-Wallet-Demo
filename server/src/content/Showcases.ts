import type { Showcase } from './types'

import { businessShowcase } from '../../config/businessShowcase'
import { lawyerShowcase } from '../../config/lawyerShowcase'
import { studentShowcase } from '../../config/studentShowcase'

const showcases: Showcase[] = [studentShowcase, lawyerShowcase, businessShowcase]

export default showcases
