# Build stage
FROM node:20-bookworm AS builder
RUN apt update && apt install -y maven openjdk-17-jdk
SHELL ["/bin/bash", "-c"]
ENV SHELL=bash
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm -g install pnpm && pnpm setup && source /root/.bashrc && pnpm self-update && pnpm setup && pnpm config set store-dir "/usr/local/share/pnpm/store/v10" --global

# Install Maven
RUN apt-get update && \
apt-get install -y maven build-essential python3 make g++ && \
apt-get clean && \
rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json tsconfig.build.json tsconfig.eslint.json ./
COPY packages packages
COPY apps/bc-wallet-traction-adapter apps/bc-wallet-traction-adapter
COPY apps/tsconfig-base.json apps/tsconfig-base.json
RUN rm -rf $(pnpm store path) && pnpm install -g rimraf typescript tslib turbo
RUN pnpm install
RUN pnpm generate:models
RUN pnpm --filter bc-wallet-openapi build:clean
RUN pnpm --filter bc-wallet-traction-openapi build:clean
RUN pnpm --filter bc-wallet-traction-adapter build:clean # don't ask me why, but in the docker compose context Turbo fails to build bc-wallet-traction-adapter which I don't pre-build it like this
RUN pnpm build
RUN pnpm deploy /deploy --filter bc-wallet-traction-adapter --prod --no-optional

# Runtime stage
FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=builder /deploy /app
ENV NODE_ENV=production
RUN echo PORT=3000  > .env
RUN echo '#!/bin/sh\necho "Waiting for message broker to start..."\nsleep 6\necho "Starting application..."\nexec node dist/index.js' > /start.sh && \
    chmod +x /start.sh
CMD ["/start.sh"]
