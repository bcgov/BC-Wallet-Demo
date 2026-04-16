FROM node:22-alpine AS base

WORKDIR /app
COPY . .
RUN yarn install


EXPOSE 5000
EXPOSE 3000

ENTRYPOINT [ "yarn", "dev"]
