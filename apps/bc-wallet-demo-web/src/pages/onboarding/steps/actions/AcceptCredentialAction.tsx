import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { motion, AnimatePresence } from 'framer-motion'
import { track } from 'insights-js'
import { startCase } from 'lodash'

import { getOrCreateCredDefId } from '../../../../api/CredentialApi'
import { ActionCTA } from '../../../../components/ActionCTA'
import { Loader } from '../../../../components/Loader'
import { Modal } from '../../../../components/Modal'
import { fade, fadeX } from '../../../../FramerAnimations'
import { useAppDispatch } from '../../../../hooks/hooks'
import { useConnection } from '../../../../slices/connection/connectionSelectors'
import { useCredentials } from '../../../../slices/credentials/credentialsSelectors'
import { setCredential } from '../../../../slices/credentials/credentialsSlice'
import { issueCredential, issueDeepCredential } from '../../../../slices/credentials/credentialsThunks'
import { useSocket } from '../../../../slices/socket/socketSelector'
import type { Credential } from '../../../../slices/types'
import { basePath } from '../../../../utils/BasePath'
import { FailedRequestModal } from '../../components/FailedRequestModal'
import { StarterCredentials } from '../../components/StarterCredentials'

export interface Props {
  connectionId: string
  credentials: Credential[]
}

export const AcceptCredentialAction: React.FC<Props> = (props: Props) => {
  const { connectionId, credentials } = props
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [isRejectedModalOpen, setIsRejectedModalOpen] = useState(false)
  const [isFailedRequestModalOpen, setIsFailedRequestModalOpen] = useState(false)
  const [credentialsIssued, setCredentialsIssued] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { isIssueCredentialLoading, error, issuedCredentials } = useCredentials()

  const { isDeepLink } = useConnection()

  const { message } = useSocket()

  const showFailedRequestModal = () => setIsFailedRequestModalOpen(true)
  const closeFailedRequestModal = () => setIsFailedRequestModalOpen(false)

  const issuedCredentialsStartCase = issuedCredentials.map((name) => startCase(name))
  const credentialsAccepted = credentials.every(
    (cred) => issuedCredentials.includes(cred.name) || issuedCredentialsStartCase.includes(cred.name)
  )

  useEffect(() => {
    if (credentials.length > 0) {
      credentials.forEach(async (item) => {
        const credDefId = (await getOrCreateCredDefId(item)).data
        if (item !== undefined) {
          if (isDeepLink) {
            dispatch(issueDeepCredential({ connectionId, cred: item, credDefId }))
          } else {
            dispatch(issueCredential({ connectionId, cred: item, credDefId }))
          }
          track({
            id: 'credential_issued',
          })
        }
      })
      setCredentialsIssued(true)
    }
  }, [connectionId])

  const handleCredentialTimeout = () => {
    if (!isIssueCredentialLoading || !error) return
    setErrorMsg(
      `The request timed out. We're sorry, but you're going to have to restart the demo. If this issue persists, please contact us.`
    )
    setIsRejectedModalOpen(true)
  }

  useEffect(() => {
    if (credentialsIssued) {
      setTimeout(() => {
        handleCredentialTimeout()
      }, 10000)
    }
  }, [credentialsIssued, isIssueCredentialLoading])

  useEffect(() => {
    if (error) {
      const msg = error.message ?? 'Issue Credential Error'
      setErrorMsg(
        `The request has failed with the following error: ${msg}. We're sorry, but you're going to have to restart. If this issue persists, please contact us. `
      )
      setIsRejectedModalOpen(true)
    }
  }, [error])

  useEffect(() => {
    if (!message || !message.endpoint || !message.state) {
      return
    }
    const { endpoint, state } = message
    if (endpoint === 'issue_credential' && state === 'credential_issued') {
      dispatch(setCredential(message))
    }
  }, [message])

  const routeError = () => {
    navigate(`${basePath}/demo`)
    dispatch({ type: 'demo/RESET' })
  }

  const sendNewCredentials = () => {
    closeFailedRequestModal()
  }

  return (
    <motion.div className="flex flex-col" variants={fadeX} initial="hidden" animate="show" exit="exit">
      <div className="flex flex-row m-auto content-center">
        {credentials.length ? (
          <AnimatePresence mode="wait">
            <motion.div className={`flex flex-1 flex-col m-auto`} variants={fade} animate="show" exit="exit">
              <StarterCredentials credentials={credentials} />
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div className="flex flex-col h-full m-auto">
            <Loader />
          </motion.div>
        )}
        {isFailedRequestModalOpen && (
          <FailedRequestModal key="credentialModal" action={sendNewCredentials} close={closeFailedRequestModal} />
        )}
        {isRejectedModalOpen && (
          <Modal title={'There seems to be an issue.'} description={errorMsg} onOk={routeError} />
        )}
      </div>
      <ActionCTA
        isCompleted={credentialsAccepted && credentials.length > 0}
        onFail={() => {
          trackSelfDescribingEvent({
            event: {
              schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
              data: {
                action: 'cred_not_received',
              },
            },
          })
          showFailedRequestModal()
        }}
      />
    </motion.div>
  )
}
