#!/bin/sh

cat > /srv/digital-trust/showcase/env-config.js << EOL
window.__env = {
  REACT_APP_HOST_BACKEND: "${REACT_APP_HOST_BACKEND:-}",
  REACT_APP_BASE_ROUTE: "${REACT_APP_BASE_ROUTE:-/digital-trust/showcase}",
  REACT_APP_SHOWCASE_BACKEND: "${REACT_APP_SHOWCASE_BACKEND:-}"
};
EOL

envsubst < /etc/caddy/Caddyfile.template > /etc/caddy/Caddyfile

exec caddy run --config /etc/caddy/Caddyfile 