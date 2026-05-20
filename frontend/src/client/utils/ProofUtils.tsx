import type { Attribute } from '../slices/types'

import log from 'loglevel'

export const getAttributesFromProof = (proof: any) => {
  const attributes: Attribute[] = []

  try {
    const requestedProof = proof?.by_format?.pres?.anoncreds?.requested_proof

    if (!requestedProof) {
      return attributes
    }

    // Try revealed_attr_groups first (grouped format)
    if (requestedProof.revealed_attr_groups) {
      for (const groupName in requestedProof.revealed_attr_groups) {
        const group = requestedProof.revealed_attr_groups[groupName]
        const values = group?.values

        if (values) {
          for (const attrName in values) {
            attributes.push({
              name: attrName,
              value: values[attrName]?.raw,
            })
          }
        }
      }
    }
    // Fallback to revealed_attrs (flat format)
    else if (requestedProof.revealed_attrs) {
      for (const attrName in requestedProof.revealed_attrs) {
        attributes.push({
          name: attrName,
          value: requestedProof.revealed_attrs[attrName]?.raw,
        })
      }
    }
  } catch (error) {
    log.error('Error extracting attributes from proof:', error)
  }

  return attributes
}
