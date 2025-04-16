import { businessCustom } from '../../config/businessCustom'
import { lawyerCustom } from '../../config/lawyerCustom'
import { studentCustom } from '../../config/studentCustom'
import type { CustomCharacter } from './types'

const characters: CustomCharacter[] = [studentCustom, lawyerCustom, businessCustom]

export default characters
