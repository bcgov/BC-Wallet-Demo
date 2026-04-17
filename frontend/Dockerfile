ARG build_image=node:22-alpine
ARG runtime_image=caddy:alpine

# build stage
FROM ${build_image} AS build-stage
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn build


# production stage
FROM ${runtime_image} AS production-stage
RUN mkdir -p /srv/digital-trust/showcase
COPY --from=build-stage /app/frontend/dist /srv/digital-trust/showcase

# Fix permissions issue with Caddy image
# - Between version 2.6.2 and 2.6.3 there were some permissions changes on the official images that stopped them from working on OpenShift.
# - This update resolves that permissions issue for OCP.
RUN chown 1001:root /usr/bin/caddy