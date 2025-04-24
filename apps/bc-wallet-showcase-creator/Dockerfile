#Build step
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat bash
RUN apk add --no-cache maven openjdk17
RUN npm -g install pnpm

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json tsconfig.build.json tsconfig.eslint.json ./
RUN pnpm install
COPY packages/bc-wallet-openapi/ packages/bc-wallet-openapi/
COPY packages/tsconfig* ./packages/
RUN cd packages/bc-wallet-openapi && pnpm install
RUN pnpm generate:models
RUN pnpm --filter bc-wallet-openapi build:clean

COPY apps/bc-wallet-showcase-creator/ ./apps/bc-wallet-showcase-creator/
RUN cd apps/bc-wallet-showcase-creator && rm -rf .next && pnpm install
RUN pnpm run build --filter bc-wallet-showcase-creator

#Runtime step
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat bash
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3050

# Copy the standalone output
COPY --from=builder /app/apps/bc-wallet-showcase-creator/.next/standalone ./
COPY --from=builder /app/apps/bc-wallet-showcase-creator/.next/static ./apps/bc-wallet-showcase-creator/.next/static
COPY --from=builder /app/apps/bc-wallet-showcase-creator/public ./apps/bc-wallet-showcase-creator/public
COPY --from=builder /app/apps/bc-wallet-showcase-creator/env.sh ./env.sh
RUN chmod +x ./env.sh

RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3050

ENTRYPOINT ["./env.sh"]
CMD ["node", "apps/bc-wallet-showcase-creator/server.js"]