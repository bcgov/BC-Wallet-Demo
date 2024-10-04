import type { Attribute } from '../slices/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAttributesFromProof = (proof: any) => {
  const proofData = proof.presentation.requested_proof.revealed_attr_groups

  const attributes: Attribute[] = []
  for (const prop in proofData) {
    for (const prop2 in proofData[prop].values) {
      attributes.push({ name: prop2, value: proofData[prop].values[prop2].raw })
    }
  }

  return attributes
}
