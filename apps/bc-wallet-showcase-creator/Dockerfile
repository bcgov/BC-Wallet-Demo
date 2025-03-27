#Build step
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN apk add --no-cache maven openjdk17
RUN npm -g install pnpm

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json tsconfig.build.json tsconfig.eslint.json ./
RUN pnpm install
COPY packages/bc-wallet-openapi/package*.json ./packages/bc-wallet-openapi/
COPY packages/tsconfig* ./packages/
RUN cd packages/bc-wallet-openapi && pnpm install
COPY packages/bc-wallet-openapi/ packages/bc-wallet-openapi/
RUN pnpm generate:models
RUN pnpm --filter bc-wallet-openapi build:clean

COPY apps/bc-wallet-showcase-creator/package*.json ./apps/bc-wallet-showcase-creator/
COPY apps/bc-wallet-showcase-creator/tsconfig* ./apps/bc-wallet-showcase-creator/
RUN cd apps/bc-wallet-showcase-creator && pnpm install
COPY apps/bc-wallet-showcase-creator/ apps/bc-wallet-showcase-creator/
RUN pnpm run build --filter bc-wallet-showcase-creator

#Runtime step
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3050
COPY --from=builder /app/apps/bc-wallet-showcase-creator/.next/standalone ./
COPY --from=builder /app/apps/bc-wallet-showcase-creator/.next/static ./.next/static
COPY --from=builder /app/apps/bc-wallet-showcase-creator/public ./public
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3050

# Run the server.js file from the correct location
CMD ["node", "apps/bc-wallet-showcase-creator/server.js"]