FROM node:24.19.0-alpine AS base

WORKDIR /app
COPY . .
RUN corepack enable && yarn install --immutable


EXPOSE 5000
EXPOSE 3000

ENTRYPOINT [ "yarn", "dev"]
