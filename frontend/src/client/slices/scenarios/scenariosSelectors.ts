import type { RootState } from '../../store/configureStore'

import { useSelector } from 'react-redux'

export const useScenarioState = () => useSelector((state: RootState) => state.scenarios)
