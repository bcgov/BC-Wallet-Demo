import type { RootState } from '../../store/configureStore'

import { useSelector } from 'react-redux'

export const useIntroduction = () => useSelector((state: RootState) => state.introduction)
