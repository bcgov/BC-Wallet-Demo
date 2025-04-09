FROM node:18-alpine as base

WORKDIR /app
COPY . .
RUN pnpm install


EXPOSE 5000
EXPOSE 3000

ENTRYPOINT [ "pnpm", "dev"]
