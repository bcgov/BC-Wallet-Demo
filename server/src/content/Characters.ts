import type { CustomCharacter } from './types'

import { lawyerCustom } from '../../config/lawyerCustom'
import { studentCustom } from '../../config/studentCustom'
import { businessCustom } from '../../config/businessCustom'

const characters: CustomCharacter[] = [studentCustom, lawyerCustom, businessCustom]

export default characters
