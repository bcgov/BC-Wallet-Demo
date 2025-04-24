# Build stage
FROM node:20-bookworm AS builder
SHELL ["/bin/bash", "-c"]
ENV SHELL=bash
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm -g install pnpm && pnpm setup && source /root/.bashrc && pnpm self-update && pnpm setup && pnpm config set store-dir "/usr/local/share/pnpm/store/v10" --global

# Install dependencies
RUN apt-get update && \
    apt-get install -y build-essential python3 make g++ && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json tsconfig.build.json tsconfig.eslint.json ./
COPY packages packages
RUN rm -rf packages/bc-wallet-adapter-client-api # We are not generating the models for this one
COPY apps/tsconfig-base.json apps/
COPY apps/bc-wallet-demo-server apps/bc-wallet-demo-server



# Install dependencies and build
RUN rm -rf $(pnpm store path) && pnpm install -g typescript ts-node
RUN pnpm install --frozen-lockfile
RUN pnpm build
RUN pnpm deploy /deploy --filter bc-wallet-demo-server --prod --no-optional


# Runtime stage
FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=builder /deploy /app
ENV NODE_ENV=production
RUN echo NODE_PORT=3000 > .env
EXPOSE 3000

CMD ["node", "build/src/index.js"]