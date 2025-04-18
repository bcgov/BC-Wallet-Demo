#!/bin/bash
set -euo pipefail

# Ensure jq is installed
if ! command -v jq >/dev/null; then
  echo "Error: jq is not installed. Please install jq (e.g., from https://stedolan.github.io/jq/download/) and ensure it is available in your PATH." >&2
  exit 1
fi


DOCKER_REGISTRY="${DOCKER_REGISTRY:-sphereonregistry.azurecr.io}"

# Extract versions from package.json files.
API_VERSION=$(jq -r .version ../../apps/bc-wallet-api-server/package.json)
ADAPTER_VERSION=$(jq -r .version ../../apps/bc-wallet-traction-adapter/package.json)

# Check that both versions match.
if [ "$API_VERSION" != "$ADAPTER_VERSION" ]; then
  echo "Error: Version mismatch - API server version ($API_VERSION) does not match traction adapter version ($ADAPTER_VERSION)" >&2
  exit 1
fi

export PACKAGE_VERSION="$API_VERSION"

# Source image names.
export API_SERVER_IMAGE="dev-bc-wallet-api-server"
export TRACTION_ADAPTER_IMAGE="dev-bc-wallet-traction-adapter"

# Remove the "dev-" prefix when tagging.
export TAGGED_API_SERVER_IMAGE="${API_SERVER_IMAGE#dev-}"
export TAGGED_TRACTION_ADAPTER_IMAGE="${TRACTION_ADAPTER_IMAGE#dev-}"