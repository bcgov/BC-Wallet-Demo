import { useSelector } from 'react-redux'

import type { RootState } from '../../store/configureStore'

export const useSection = () => useSelector((state: RootState) => state.section)
