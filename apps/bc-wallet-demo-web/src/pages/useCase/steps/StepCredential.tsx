// import type { Attribute, CredentialData, Step } from '../../../slices/types'

// import { AnimatePresence, motion } from 'framer-motion'
// import { track } from 'insights-js'
// import React, { useEffect, useState } from 'react'

// import { fade, fadeX } from '../../../FramerAnimations'
// import { ActionCTA } from '../../../components/ActionCTA'
// import { Loader } from '../../../components/Loader'
// import { useAppDispatch } from '../../../hooks/hooks'
// import { useInterval } from '../../../hooks/useInterval'
// import {
//   deleteCredentialById,
//   fetchCredentialsByConId,
//   issueCredential,
// } from '../../../slices/credentials/credentialsThunks'
// import { isCredIssued } from '../../../utils/Helpers'
// import { getAttributesFromProof } from '../../../utils/ProofUtils'
// import { Credential } from '../../onboarding/components/Credential'
// import { FailedRequestModal } from '../../onboarding/components/FailedRequestModal'
// import { StepInfo } from '../components/StepInfo'

// export interface Props {
//   step: Step
//   connectionId: string
//   issueCredentials: CredentialData[]
//   credentials: any[]
//   proof: any | undefined
// }

// export const StepCredential: React.FC<Props> = ({ step, connectionId, issueCredentials, credentials, proof }) => {
//   const dispatch = useAppDispatch()

//   const [isFailedRequestModalOpen, setIsFailedRequestModalOpen] = useState(false)
//   const showFailedRequestModal = () => setIsFailedRequestModalOpen(true)
//   const closeFailedRequestModal = () => setIsFailedRequestModalOpen(false)

//   const credentialsAccepted = Object.values(credentials).every((x) => isCredIssued(x.state))
//   const [issuedCredData, setIssuedCredData] = useState<CredentialData[]>([])

//   const issueCreds = () => {
//     // get attributes from proof
//     let attributes: Attribute[] = []
//     if (step.useProof && proof) {
//       attributes = getAttributesFromProof(proof)
//     }

//     // create new object with attributes
//     const credentialData = issueCredentials.map((credential: CredentialData) => ({
//       ...credential,
//       attributes: credential.attributes ? attributes.concat(credential.attributes) : attributes,
//     }))

//     // save data for when issue fails
//     setIssuedCredData(credentialData)

//     // issue credentials
//     credentialData.forEach((item) => {
//       // dispatch(issueCredential({ connectionId: connectionId, cred: item }))
//       track({
//         id: 'credential_issued',
//       })
//     })
//   }

//   useEffect(() => {
//     if (credentials.length === 0) issueCreds()
//   }, [])

//   useInterval(
//     () => {
//       if (document.visibilityState === 'visible') dispatch(fetchCredentialsByConId(connectionId))
//     },
//     !credentialsAccepted ? 1000 : null
//   )

//   const sendNewCredentials = () => {
//     credentials.forEach((cred) => {
//       if (!isCredIssued(cred.state)) {
//         dispatch(deleteCredentialById(cred.credential_exchange_id))
//         const newCredential = issuedCredData.find((item) => {
//           return item.credentialDefinitionId === cred.credential_offer.cred_def_id
//         })
//         // if (newCredential) dispatch(issueCredential({ connectionId: connectionId, cred: newCredential }))
//       }
//     })
//     closeFailedRequestModal()
//   }

//   const renderCredentials = credentials
//     .slice()
//     .map((cred, idx) => {
//       const data = issueCredentials.find((item) => {
//         return item.credentialDefinitionId === cred?.credentialDefinitionId
//       })
//       if (data) return <Credential key={cred.id} title={`Credential ${idx + 1}`} credential={cred} data={data} />
//     })
//     .sort((a, b) => a?.props.data.id.localeCompare(b?.props.data.id))

//   return (
//     <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit" className="flex flex-col h-full">
//       <StepInfo title={step.title} description={step.description} />
//       <div className="flex flex-1-1 m-auto">
//         <motion.div className={`flex flex-1-1 flex-col m-auto`} variants={fade} animate="show" exit="exit">
//           {credentials.length <= (issueCredentials?.length ?? 0) ? (
//             <AnimatePresence mode="wait">{renderCredentials}</AnimatePresence>
//           ) : (
//             <motion.div className="flex flex-col h-full m-auto">
//               <Loader />
//             </motion.div>
//           )}
//         </motion.div>
//       </div>
//       <ActionCTA isCompleted={credentialsAccepted} onFail={showFailedRequestModal} />
//       {isFailedRequestModalOpen && (
//         <FailedRequestModal key="credentialModal" action={sendNewCredentials} close={closeFailedRequestModal} />
//       )}
//     </motion.div>
//   )
// }

export {}
