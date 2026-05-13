import type { Attribute } from '../slices/types'

export const getAttributesFromProof = (proof: any) => {
  const proofData = proof.by_format.pres.anoncreds.requested_proof.revealed_attr_groups

  const attributes: Attribute[] = []
  // Iterate through each attribute group (e.g., "medical-license")
  for (const groupName in proofData) {
    const group = proofData[groupName]
    // Get the values object which contains the revealed attributes
    const values = group.values
    // Iterate through each attribute in the group
    for (const attrName in values) {
      attributes.push({
        name: attrName,
        value: values[attrName].raw,
      })
    }
  }

  return attributes
}
