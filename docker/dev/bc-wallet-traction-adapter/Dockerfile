#build stage
FROM node:20-bookworm AS builder
SHELL ["/bin/bash", "-c"]
ENV SHELL=bash
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN apt-get update && apt-get install -y \
    maven \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

RUN npm -g install pnpm && pnpm setup && source /root/.bashrc && pnpm self-update && pnpm setup && pnpm config set store-dir "/usr/local/share/pnpm/store/v10" --global

# Install Maven
# In your builder stage, add:
  RUN apt-get update && \
  apt-get install -y maven build-essential python3 make g++ && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY . /build

RUN mvn -version

RUN pnpm store prune && pnpm install -g rimraf typescript tslib turbo
RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter=credential-showcase-traction-adapter build

RUN pnpm deploy /deploy --filter credential-showcase-traction-adapter --prod --no-optional

# Runtime stage
FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=builder /deploy /app
ENV NODE_ENV=production
RUN echo PORT=3000  > .env
CMD ["node", "dist/index.js"]
