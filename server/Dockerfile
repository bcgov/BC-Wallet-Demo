# syntax=docker/dockerfile:1

FROM node:24.19.0-alpine AS build

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY server/package.json ./server/
COPY frontend/package.json ./frontend/

ENV HUSKY=0

RUN corepack enable
RUN --mount=type=cache,target=/root/.yarn/berry/cache \
    yarn install --immutable --network-timeout 600000 --non-interactive

COPY server ./server

WORKDIR /app/server
RUN yarn build

FROM node:24.19.0-alpine

WORKDIR /app/server

ENV NODE_ENV=production \
    UPLOADS_DIR=/app/uploads

COPY --from=build /app/package.json /app/yarn.lock /app/
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/server/package.json ./
COPY --from=build /app/server/build ./build

# OpenShift restricted-v2 SCC runs containers with an arbitrary UID but
# always GID 0 (root group). Make the uploads dir group-writable so any
# UID in group 0 can write to it.
RUN mkdir -p /app/uploads && chgrp 0 /app/uploads && chmod g+rwx /app/uploads

EXPOSE 5000

CMD ["node", "-r", "dotenv/config", "build/src/index.js"]
