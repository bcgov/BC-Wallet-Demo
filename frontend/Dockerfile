ARG build_image=node:22-alpine
ARG runtime_image=caddy:alpine

# build stage
FROM ${build_image} AS build-stage
WORKDIR /app
ENV HUSKY=0
COPY . .
# CRA inlines REACT_APP_* at compile time — pass from CI via --build-arg.
ARG REACT_APP_INSIGHTS_PROJECT_ID
ARG REACT_APP_HOST_BACKEND
ENV REACT_APP_INSIGHTS_PROJECT_ID=$REACT_APP_INSIGHTS_PROJECT_ID
ENV REACT_APP_HOST_BACKEND=$REACT_APP_HOST_BACKEND
RUN yarn install --frozen-lockfile --network-timeout 600000
RUN yarn workspace frontend build


# production stage
FROM ${runtime_image} AS production-stage
RUN mkdir -p /srv/digital-trust/showcase
COPY --from=build-stage /app/frontend/build /srv/digital-trust/showcase

# Fix permissions issue with Caddy image
# - Between version 2.6.2 and 2.6.3 there were some permissions changes on the official images that stopped them from working on OpenShift.
# - This update resolves that permissions issue for OCP.
RUN chown 1001:root /usr/bin/caddy