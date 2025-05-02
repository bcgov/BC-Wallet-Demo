#!/bin/sh

cat > /srv/digital-trust/showcase/env-config.js << EOL
window.__env = {
  REACT_APP_DEMO_API_URL: "${REACT_APP_DEMO_API_URL:-}",
  REACT_APP_BASE_ROUTE: "${REACT_APP_BASE_ROUTE:-/digital-trust/showcase}",
  REACT_APP_SHOWCASE_API_URL: "${REACT_APP_SHOWCASE_API_URL:-}"
};
EOL

exec caddy run --config /etc/caddy/Caddyfile 