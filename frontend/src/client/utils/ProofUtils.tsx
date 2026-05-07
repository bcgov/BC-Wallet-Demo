import type { Attribute } from '../slices/types'

export const getAttributesFromProof = (proof: any) => {
  const proofData = proof.by_format.pres.indy.requested_proof.revealed_attrs

  const attributes: Attribute[] = []
  for (const prop in proofData) {
    for (const prop2 in proofData[prop].values) {
      attributes.push({ name: prop2, value: proofData[prop].values[prop2].raw })
    }
  }

  return attributes
}
