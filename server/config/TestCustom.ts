import type { CustomCharacter } from '../src/content/types'

import { getDateInt } from '../src/utils/dateint'

export const TestCustom: CustomCharacter = {
  name: 'Test',
  type: 'description',
  image: '/public/common/icon-person-light.svg',
  description: 'description',
  revocationInfo: [],
  progressBar: [
    {
      name: 'person',
      onboardingStep: 'PICK_CHARACTER',
      iconLight: '/public/common/icon-person-light.svg',
      iconDark: '/public/common/icon-person-dark.svg',
    },
  ],
  onboarding: [
    {
      screenId: 'PICK_CHARACTER',
      title: 'Meet Test',
      text: 'This is a new showcase for Test.',
    },
  ],
  useCases: [],
}
