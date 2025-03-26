# Build stage
FROM node:20-bookworm AS builder
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
COPY packages/bc-wallet-traction-adapter packages/bc-wallet-traction-adapter/
COPY packages/tsconfig* packages/
RUN rm -rf $(pnpm store path) && pnpm install -g rimraf typescript tslib turbo
RUN pnpm install
RUN cd packages/ && pnpm build
RUN pnpm deploy /deploy --filter bc-wallet-traction-adapter --prod --no-optional
RUN ls -la /
RUN pwd
RUN ls -la /build

# Runtime stage
FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=builder /deploy /app
ENV NODE_ENV=production
RUN echo PORT=3000  > .env
CMD ["node", "dist/index.js"]