import { useSelector } from 'react-redux'

import type { RootState } from '../../store/configureStore'

export const useConnection = () => useSelector((state: RootState) => state.connection)
export const useConnectionId = () => useSelector((state: RootState) => state.connection.id)
