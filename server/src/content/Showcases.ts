import type { Showcase } from './types'

import businessShowcase from '../../config/businessShowcase.json'
import lawyerShowcase from '../../config/lawyerShowcase.json'
import studentShowcase from '../../config/studentShowcase.json'

const showcases: Showcase[] = [studentShowcase as Showcase, lawyerShowcase as Showcase, businessShowcase as Showcase]

export default showcases
