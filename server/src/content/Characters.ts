import type { CustomCharacter } from './types'

import { businessCustom } from '../../config/businessCustom'
import { lawyerCustom } from '../../config/lawyerCustom'
import { studentCustom } from '../../config/studentCustom'

const characters: CustomCharacter[] = [studentCustom, lawyerCustom, businessCustom]

export default characters
