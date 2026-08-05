# syntax=docker/dockerfile:1
# Multi-stage build for Next.js (output: standalone).
# Service image only — DB runs in a separate container (see docker-compose.yml).

# ---- deps: install node_modules (full, incl. dev for the build) ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com \
 && npm ci

# ---- builder: compile the app, emit .next/standalone ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: minimal production image ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
# standalone server (+ its pruned node_modules: pg, ...)
COPY --from=builder /app/.next/standalone ./
# turndown is imported dynamically (HTML->markdown server action + db seed), so
# Next standalone tracing drops it. Copy it (+ its only dep domino) from the
# builder so it resolves at runtime and during seeding.
COPY --from=builder /app/node_modules/turndown ./node_modules/turndown
COPY --from=builder /app/node_modules/@mixmark-io ./node_modules/@mixmark-io
# static + public assets
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# API Token 后台在运行时从 docs/api.md 渲染并导出接口文档。
COPY --from=builder /app/docs ./docs
# db seed script (idempotent); deps already in node_modules above
COPY --from=builder /app/scripts ./scripts
EXPOSE 3000
CMD ["node", "server.js"]
