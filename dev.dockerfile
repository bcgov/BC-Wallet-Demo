FROM node:18-alpine as base

WORKDIR /app
COPY . .
RUN yarn install


EXPOSE 5000
EXPOSE 3000

ENTRYPOINT [ "yarn", "dev"]
