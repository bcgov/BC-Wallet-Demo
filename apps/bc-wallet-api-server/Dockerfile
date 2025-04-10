# Build stage
FROM node:20-bookworm AS builder
RUN apt update && apt install -y maven openjdk-17-jdk

SHELL ["/bin/bash", "-c"]
ENV SHELL=bash
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm -g install pnpm && pnpm setup && source /root/.bashrc && pnpm self-update && pnpm setup && pnpm config set store-dir "/usr/local/share/pnpm/store/v10" --global

# Install Maven and other dependencies
RUN apt-get update && \
    apt-get install -y maven build-essential python3 make g++ openjdk-17-jdk && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json tsconfig.build.json tsconfig.eslint.json ./
COPY packages packages
RUN rm -rf packages/bc-wallet-traction-adapter # TODO This package has to be moved to apps because it's not a lib and has special needs to build
COPY apps/tsconfig-base.json apps/
COPY apps/bc-wallet-api-server apps/bc-wallet-api-server


RUN rm -rf $(pnpm store path) && pnpm install -g rimraf typescript tslib drizzle-kit
RUN pnpm install
RUN pnpm generate:models
RUN pnpm --filter bc-wallet-openapi build:clean
RUN pnpm --filter bc-wallet-adapter-client-api build:clean # FIXME turbo does not build this correctly if I do not build bc-wallet-adapter-client-api first
RUN pnpm build
RUN pnpm deploy /deploy --filter bc-wallet-api-server --prod --no-optional

# Runtime stage
FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=builder /deploy /app
COPY --from=builder /build/apps/bc-wallet-api-server/src/database/migrations /app/dist/database/migrations
ENV NODE_ENV=production
RUN echo PORT=3000  > .env
EXPOSE 3000

RUN echo '#!/bin/sh\necho "Connecting with database to start..."\nsleep 10\necho "Starting application..."\nexec node dist/index.js' > /start.sh && \
    chmod +x /start.sh
CMD ["/start.sh"]
