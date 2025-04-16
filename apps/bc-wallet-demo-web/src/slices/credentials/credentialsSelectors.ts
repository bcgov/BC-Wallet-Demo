import { useSelector } from 'react-redux'

import type { RootState } from '../../store/configureStore'

export const useCredentials = () => useSelector((state: RootState) => state.credentials)
