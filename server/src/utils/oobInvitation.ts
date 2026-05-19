export type OobInvitationMessage = Record<string, unknown>

/** When false, skip short URL creation and `GET …/i/:code` resolution. Default: enabled. */
export function isShortInvitationUrlEnabled(): boolean {
  const raw = process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED?.trim().toLowerCase()
  if (!raw) {
    return true
  }
  return !['false', '0', 'no', 'off'].includes(raw)
}

/** OOB invitation `@id` (ACA-Py), normalized for use as a URL path segment. */
export function getOobInvitationId(invitation: OobInvitationMessage | undefined): string | undefined {
  if (!invitation || typeof invitation !== 'object') {
    return undefined
  }
  const id = invitation['@id']
  if (typeof id !== 'string' || !id.trim()) {
    return undefined
  }
  const trimmed = id.trim()
  if (trimmed.startsWith('urn:uuid:')) {
    return trimmed.slice('urn:uuid:'.length)
  }
  return trimmed
}

export function buildShortInvitationUrl(oobId: string, publicOrigin: string, baseRoute: string): string {
  const origin = publicOrigin.replace(/\/$/, '')
  const route = baseRoute.startsWith('/') ? baseRoute : `/${baseRoute}`
  return `${origin}${route}/i/${encodeURIComponent(oobId)}`
}
