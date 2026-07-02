FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm --filter @cx/shared --filter @cx/db --filter @cx/ai build
RUN pnpm --filter @cx/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app /app
EXPOSE 3001
CMD ["pnpm", "--filter", "@cx/api", "start"]
