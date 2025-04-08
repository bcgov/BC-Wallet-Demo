# Build stage
FROM node:20-bookworm AS builder
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
RUN pnpm install -g drizzle-kit
WORKDIR /build
COPY . /build
RUN rm -rf $(pnpm store path) && pnpm install -g rimraf typescript tslib
RUN pnpm install
RUN cd packages/bc-wallet-openapi && mvn -U clean install && cd ../..
RUN pnpm build
RUN pnpm deploy /deploy --filter bc-wallet-api-server --prod --no-optional

# Runtime stage
FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=builder /deploy /app
COPY --from=builder /build/apps/bc-wallet-api-server/src/database/migrations /app/dist/database/migrations
ENV NODE_ENV=production
RUN echo PORT=3000  > .env

#USE THIS SCRIPT IF YOU ARE USING DOCKER-COMPOSE. SINCE APP IS STARTING BEFORE DATABASE IS READY.
RUN echo '#!/bin/sh\necho "Waiting for database to start..."\nsleep 10\necho "Starting application..."\nexec node dist/index.js' > /start.sh && \
    chmod +x /start.sh

CMD ["/start.sh"]