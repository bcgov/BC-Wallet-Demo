ARG build_image=node:20-alpine
ARG runtime_image=caddy:alpine

# build stage
FROM ${build_image} as build-stage
RUN npm -g install pnpm 
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/bc-wallet-demo-web/ ./apps/bc-wallet-demo-web/
RUN npm install -g pnpm typescript
RUN pnpm install
RUN pnpm --filter bc-wallet-openapi build
RUN pnpm --filter bc-wallet-demo-web build

# production stage
FROM ${runtime_image} as production-stage
RUN mkdir -p /srv/digital-trust/showcase
COPY --from=build-stage /app/apps/bc-wallet-demo-web/build /srv/digital-trust/showcase

RUN chown 1001:root /usr/bin/caddy