import { useSelector } from 'react-redux'

import type { RootState } from '../../store/configureStore'

export const useSocket = () => useSelector((state: RootState) => state.socket)
