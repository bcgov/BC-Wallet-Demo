ARG build_image=node:20-alpine
ARG runtime_image=caddy:alpine

# build stage
FROM ${build_image} as build-stage
RUN apk add --no-cache maven openjdk17
RUN npm -g install pnpm 
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/bc-wallet-demo-web/ ./apps/bc-wallet-demo-web/
RUN npm install -g pnpm typescript
RUN pnpm install
RUN pnpm generate:models
RUN pnpm --filter bc-wallet-openapi build:clean
RUN pnpm --filter bc-wallet-demo-web build

# production stage
FROM ${runtime_image} as production-stage
COPY --from=build-stage /app/apps/bc-wallet-demo-web/build /srv/digital-trust/showcase

# Create a Caddyfile
RUN echo ':80 {' > /etc/caddy/Caddyfile && \
    echo '    # Most common security headers' >> /etc/caddy/Caddyfile && \
    echo '    header {' >> /etc/caddy/Caddyfile && \
    echo '        # enable CSP' >> /etc/caddy/Caddyfile && \
    echo '        Content-Security-Policy "default-src * data: blob: filesystem: '\''unsafe-inline'\'' '\''unsafe-eval'\''"' >> /etc/caddy/Caddyfile && \
    echo '        # enable HSTS' >> /etc/caddy/Caddyfile && \
    echo '        Strict-Transport-Security "max-age=86400; includeSubDomains"' >> /etc/caddy/Caddyfile && \
    echo '        # disable clients from sniffing the media type' >> /etc/caddy/Caddyfile && \
    echo '        X-Content-Type-Options "nosniff"' >> /etc/caddy/Caddyfile && \
    echo '        # XSS protection' >> /etc/caddy/Caddyfile && \
    echo '        X-XSS-Protection 1' >> /etc/caddy/Caddyfile && \
    echo '        # clickjacking protection' >> /etc/caddy/Caddyfile && \
    echo '        X-Frame-Options DENY' >> /etc/caddy/Caddyfile && \
    echo '    }' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '    # Log everything to stdout' >> /etc/caddy/Caddyfile && \
    echo '    log {' >> /etc/caddy/Caddyfile && \
    echo '        output stdout' >> /etc/caddy/Caddyfile && \
    echo '        level DEBUG' >> /etc/caddy/Caddyfile && \
    echo '    }' >> /etc/caddy/Caddyfile && \
    echo '    # Set server root to parent directory' >> /etc/caddy/Caddyfile && \
    echo '    root * /srv' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '    # Enable static file serving with proper MIME types' >> /etc/caddy/Caddyfile && \
    echo '    file_server' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '    # Enable gzip, zstd compression' >> /etc/caddy/Caddyfile && \
    echo '    encode zstd gzip' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '    # Enable templates module' >> /etc/caddy/Caddyfile && \
    echo '    templates' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '    vars basePath {$REACT_APP_BASE_ROUTE}' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '    # Health check for openshift' >> /etc/caddy/Caddyfile && \
    echo '    handle /health {' >> /etc/caddy/Caddyfile && \
    echo '        respond 200' >> /etc/caddy/Caddyfile && \
    echo '    }' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '    handle {$REACT_APP_BASE_ROUTE}/demo {' >> /etc/caddy/Caddyfile && \
    echo '        redir {vars.basePath}' >> /etc/caddy/Caddyfile && \
    echo '    }' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '    handle {$REACT_APP_BASE_ROUTE}/dashboard {' >> /etc/caddy/Caddyfile && \
    echo '        redir {vars.basePath}' >> /etc/caddy/Caddyfile && \
    echo '    }' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '    handle {$REACT_APP_BASE_ROUTE}* {' >> /etc/caddy/Caddyfile && \
    echo '        @websockets {' >> /etc/caddy/Caddyfile && \
    echo '            header Connection *Upgrade*' >> /etc/caddy/Caddyfile && \
    echo '            header Upgrade websocket' >> /etc/caddy/Caddyfile && \
    echo '        }' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '        reverse_proxy @websockets {$REACT_APP_HOST_BACKEND}' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '        # Required for SPA router to work' >> /etc/caddy/Caddyfile && \
    echo '        @spa_router {' >> /etc/caddy/Caddyfile && \
    echo '            not path {$REACT_APP_BASE_ROUTE}/demo/* {$REACT_APP_BASE_ROUTE}/server/* {$REACT_APP_BASE_ROUTE}/agent/ready {$REACT_APP_BASE_ROUTE}/public/* {$REACT_APP_BASE_ROUTE}/qr' >> /etc/caddy/Caddyfile && \
    echo '            not path {$REACT_APP_BASE_ROUTE}/static/*' >> /etc/caddy/Caddyfile && \
    echo '            file {' >> /etc/caddy/Caddyfile && \
    echo '                try_files {path} {$REACT_APP_BASE_ROUTE}/index.html' >> /etc/caddy/Caddyfile && \
    echo '            }' >> /etc/caddy/Caddyfile && \
    echo '        }' >> /etc/caddy/Caddyfile && \
    echo '        rewrite @spa_router {http.matchers.file.relative}' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '        # pass API requests to backend' >> /etc/caddy/Caddyfile && \
    echo '        @pass {' >> /etc/caddy/Caddyfile && \
    echo '            path {$REACT_APP_BASE_ROUTE}/demo/* {$REACT_APP_BASE_ROUTE}/server/* {$REACT_APP_BASE_ROUTE}/agent/ready {$REACT_APP_BASE_ROUTE}/public/* {$REACT_APP_BASE_ROUTE}/qr' >> /etc/caddy/Caddyfile && \
    echo '        }' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '        # Proxy requests to API service' >> /etc/caddy/Caddyfile && \
    echo '        reverse_proxy @pass {$REACT_APP_HOST_BACKEND} {' >> /etc/caddy/Caddyfile && \
    echo '            trusted_proxies 0.0.0.0/0' >> /etc/caddy/Caddyfile && \
    echo '            header_up Host {upstream_hostport}' >> /etc/caddy/Caddyfile && \
    echo '            header_up X-Forwarded-Host {host}' >> /etc/caddy/Caddyfile && \
    echo '        }' >> /etc/caddy/Caddyfile && \
    echo '    }' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '    handle {' >> /etc/caddy/Caddyfile && \
    echo '        redir {vars.basePath}' >> /etc/caddy/Caddyfile && \
    echo '    }' >> /etc/caddy/Caddyfile && \
    echo '}' >> /etc/caddy/Caddyfile

RUN chown 1001:root /usr/bin/caddy