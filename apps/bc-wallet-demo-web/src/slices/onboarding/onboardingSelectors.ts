import { useSelector } from 'react-redux'

import type { RootState } from '../../store/configureStore'

export const useOnboarding = () => useSelector((state: RootState) => state.onboarding)
