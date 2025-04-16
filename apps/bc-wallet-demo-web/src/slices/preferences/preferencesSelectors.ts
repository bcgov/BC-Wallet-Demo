import { useSelector } from 'react-redux'

import type { RootState } from '../../store/configureStore'

export const usePreferences = () => useSelector((state: RootState) => state.preferences)
