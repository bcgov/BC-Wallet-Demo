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

COPY apps/bc-wallet-demo-web/Caddyfile.template /etc/caddy/Caddyfile.template
COPY apps/bc-wallet-demo-web/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN chown 1001:root /usr/bin/caddy
RUN apk add --no-cache gettext

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]