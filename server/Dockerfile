FROM node:22-alpine AS base

WORKDIR /app
COPY . .
RUN npm install -g typescript
RUN npm install -g ts-node
RUN yarn install

WORKDIR /app/server

EXPOSE 5000

ENTRYPOINT [ "ts-node", "src/index.ts"]
