import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import { useNavigate } from 'react-router-dom'

import { motion, AnimatePresence } from 'framer-motion'
import { KBarAnimator, KBarPortal, KBarPositioner, KBarProvider, KBarSearch } from 'kbar'

import { confettiFade } from '../FramerAnimations'
import { useAppDispatch } from '../hooks/hooks'
import { usePreferences } from '../slices/preferences/preferencesSelectors'
import {
  resetDashboard,
  setDarkMode,
  toggleCharacterUpload,
  toggleHiddenUseCases,
  toggleRevocation,
} from '../slices/preferences/preferencesSlice'
import { fetchWallets } from '../slices/wallets/walletsThunks'
import { basePath } from './BasePath'
import { RenderResults } from './RenderResults'

interface Props {
  children?: React.ReactNode
}

export const KBar: React.FC<Props> = ({ children }) => {
  const dispatch = useAppDispatch()
  const { demoCompleted } = usePreferences()
  const [confettiPieces, setConfettiPieces] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (demoCompleted && location.pathname.includes('dashboard')) {
      setConfettiPieces(200)
      setTimeout(() => {
        setConfettiPieces(0)
      }, 10000)
    }
  }, [demoCompleted])

  const actions = [
    {
      id: 'confetti',
      name: 'Make it rain…',
      shortcut: ['c'],
      keywords: 'confetti',
      perform: () => {
        setConfettiPieces(200)
        setTimeout(() => {
          setConfettiPieces(0)
        }, 1300)
      },
    },
    {
      id: 'toggleHiddenUsecases',
      name: 'Show/Hide hidden use cases',
      keywords: 'use case toggle hide',
      perform: () => {
        dispatch(toggleHiddenUseCases())
      },
    },
    {
      id: 'toggleRevocation',
      name: 'Toggle revocation on/off',
      keywords: 'Revocation revoke toggle',
      perform: () => {
        dispatch(toggleRevocation())
      },
    },
    {
      id: 'toggleCharacterUpload',
      name: 'Toggle character upload on/off',
      keywords: 'toggle character upload',
      perform: () => {
        dispatch(toggleCharacterUpload())
      },
    },
    {
      id: 'resetDashboard',
      name: 'Reset dashboard',
      shortcut: ['d'],
      keywords: 'Reset completed use cases',
      perform: () => {
        dispatch(resetDashboard())
      },
    },
    {
      id: 'resetDemo',
      name: 'Reset demo',
      shortcut: ['r'],
      keywords: 'Reset demo',
      perform: () => {
        navigate(`${basePath}/`)
        dispatch({ type: 'demo/RESET' })
        dispatch(fetchWallets())
      },
    },
    {
      id: 'theme',
      name: 'Change theme…',
      keywords: 'interface color dark light',
      section: 'Preferences',
    },
    {
      id: 'darkTheme',
      name: 'Dark',
      keywords: 'dark theme',
      section: '',
      perform: () => {
        document.documentElement.classList.add('dark')
        dispatch(setDarkMode(true))
      },
      parent: 'theme',
    },
    {
      id: 'lightTheme',
      name: 'Light',
      keywords: 'light theme',
      section: '',
      perform: () => {
        document.documentElement.classList.remove('dark')
        dispatch(setDarkMode(false))
      },
      parent: 'theme',
    },
  ]

  const searchStyle = {
    padding: '12px 16px',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box' as React.CSSProperties['boxSizing'],
    outline: 'none',
    border: 'none',
    background: '#FFFFF',
    color: 'var(--foreground)',
  }

  const animatorStyle = {
    maxWidth: '500px',
    width: '100%',
    background: '#FFFFF',
    color: 'var(--foreground)',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
  }

  return (
    <div>
      <AnimatePresence>
        {confettiPieces > 0 && (
          <motion.div variants={confettiFade} initial="hidden" animate="show" exit="exit">
            <Confetti
              key="confetti"
              width={window.innerWidth}
              height={window.innerHeight}
              numberOfPieces={confettiPieces}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <KBarProvider actions={actions} options={{ enableHistory: true, disableScrollbarManagement: true }}>
        <KBarPortal>
          <KBarPositioner>
            <KBarAnimator style={animatorStyle}>
              <KBarSearch style={searchStyle} placeholder="I see you found the secret menu…" />
              <RenderResults />
            </KBarAnimator>
          </KBarPositioner>
        </KBarPortal>
      </KBarProvider>
      {children}
    </div>
  )
}
