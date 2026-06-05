#!/usr/bin/env bash
# Register or remove a PR-specific Traction webhook without disturbing other URLs.
#
# Usage:
#   showcase-traction-webhook.sh add
#   showcase-traction-webhook.sh remove
#
# Required environment:
#   TRACTION_URL              — tenant proxy base (no trailing slash)
#   OPENSHIFT_DEV_NAMESPACE   — namespace containing showcase-traction Secret
#   PR_NUM                    — pull request number
#   SHOWCASE_PR_HOST_SUFFIX   — host fragment after pr-<N>- (no scheme)
#
# Optional:
#   SHOWCASE_BASE_ROUTE       — default /digital-trust/showcase
#   TRACTION_SECRET_NAME      — default showcase-traction

set -euo pipefail

action="${1:-}"
if [[ "${action}" != "add" && "${action}" != "remove" ]]; then
  echo "Usage: $0 add|remove" >&2
  exit 2
fi

: "${TRACTION_URL:?TRACTION_URL is required}"
: "${OPENSHIFT_DEV_NAMESPACE:?OPENSHIFT_DEV_NAMESPACE is required}"
: "${PR_NUM:?PR_NUM is required}"
: "${SHOWCASE_PR_HOST_SUFFIX:?SHOWCASE_PR_HOST_SUFFIX is required}"

SHOWCASE_BASE_ROUTE="${SHOWCASE_BASE_ROUTE:-/digital-trust/showcase}"
TRACTION_SECRET_NAME="${TRACTION_SECRET_NAME:-showcase-traction}"

read_secret_key() {
  local key="$1"
  oc get secret "${TRACTION_SECRET_NAME}" -n "${OPENSHIFT_DEV_NAMESPACE}" \
    -o "jsonpath={.data.${key}}" 2>/dev/null | base64 -d
}

TRACTION_TENANT_ID="$(read_secret_key TRACTION_TENANT_ID)"
TRACTION_TENANT_API_KEY="$(read_secret_key TRACTION_TENANT_API_KEY)"
WEBHOOK_SECRET="$(read_secret_key WEBHOOK_SECRET)"

if [[ -z "${TRACTION_TENANT_ID}" || -z "${TRACTION_TENANT_API_KEY}" || -z "${WEBHOOK_SECRET}" ]]; then
  echo "::error::Secret ${TRACTION_SECRET_NAME} in ${OPENSHIFT_DEV_NAMESPACE} must contain TRACTION_TENANT_ID, TRACTION_TENANT_API_KEY, and WEBHOOK_SECRET."
  exit 1
fi

traction_url="${TRACTION_URL%/}"
public_origin="https://pr-${PR_NUM}-${SHOWCASE_PR_HOST_SUFFIX}"
# ACA-Py appends /topic/{topic}/ to the URL before the # fragment.
pr_webhook_url="${public_origin}${SHOWCASE_BASE_ROUTE}/demo/whook#${WEBHOOK_SECRET}"

tenant_jwt="$(
  curl -sfS -X POST "${traction_url}/multitenancy/tenant/${TRACTION_TENANT_ID}/token" \
    -H "Content-Type: application/json" \
    -d "{\"api_key\":\"${TRACTION_TENANT_API_KEY}\"}" \
    | jq -r '.token // empty'
)"

if [[ -z "${tenant_jwt}" ]]; then
  echo "::error::Failed to obtain tenant JWT from ${traction_url}/multitenancy/tenant/${TRACTION_TENANT_ID}/token"
  exit 1
fi

wallet_json="$(
  curl -sfS "${traction_url}/tenant/wallet" \
    -H "Authorization: Bearer ${tenant_jwt}"
)"

current_urls="$(
  echo "${wallet_json}" | jq -c '.settings["wallet.webhook_urls"] // .wallet_webhook_urls // []'
)"

if ! echo "${current_urls}" | jq -e 'type == "array"' >/dev/null 2>&1; then
  echo "::error::Unexpected wallet.webhook_urls shape from GET /tenant/wallet"
  exit 1
fi

case "${action}" in
  add)
    if jq -e --arg url "${pr_webhook_url}" --argjson current "${current_urls}" \
      '($current | index($url)) != null' >/dev/null; then
      echo "PR webhook already registered: ${public_origin}${SHOWCASE_BASE_ROUTE}/demo/whook#***"
      exit 0
    fi
    next_urls="$(
      jq -cn --arg url "${pr_webhook_url}" --argjson current "${current_urls}" \
        '$current + [$url]'
    )"
    ;;
  remove)
    # Drop only this PR's exact callback URL; other PRs and dev webhooks stay registered.
    removed_count="$(
      jq --arg url "${pr_webhook_url}" --argjson current "${current_urls}" \
        '[ $current[] | select(. == $url) ] | length'
    )"
    if [[ "${removed_count}" -eq 0 ]]; then
      echo "No webhook registered for pr-${PR_NUM} (${public_origin}); nothing to remove."
      exit 0
    fi
    next_urls="$(
      jq -cn --arg url "${pr_webhook_url}" --argjson current "${current_urls}" \
        '[ $current[] | select(. != $url) ]'
    )"
    ;;
esac

put_body="$(jq -cn --argjson urls "${next_urls}" '{ wallet_webhook_urls: $urls }')"

curl -sfS -X PUT "${traction_url}/tenant/wallet" \
  -H "Authorization: Bearer ${tenant_jwt}" \
  -H "Content-Type: application/json" \
  -d "${put_body}" >/dev/null

case "${action}" in
  add)
    echo "Registered PR webhook for pr-${PR_NUM}: ${public_origin}${SHOWCASE_BASE_ROUTE}/demo/whook#***"
    ;;
  remove)
    echo "Removed webhook for pr-${PR_NUM} only; ${removed_count} URL(s) deleted, other webhooks unchanged."
    ;;
esac
