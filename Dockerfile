FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- deps: ตรงนี้ต้องมี devDependencies เพราะใช้ตอน build ----
FROM base AS deps
ENV NODE_ENV=development
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- builder: ใช้ deps ที่มี devDeps มาด้วย ----
FROM deps AS builder
# Set NODE_ENV=production for Next.js build (devDeps still available from deps stage)
ENV NODE_ENV=production

COPY . .

# Build-time envs for Next.js public/runtime configuration
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MEDIA_BASE_URL
ARG NEXTAUTH_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_MEDIA_BASE_URL=${NEXT_PUBLIC_MEDIA_BASE_URL}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}

RUN pnpm build

# หลัง build เสร็จค่อยตัด devDeps ทิ้งให้ node_modules ผอมลง
RUN pnpm prune --prod

# ---- runner: ตัว runtime จริง ใช้ prod-only deps ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy only what is needed to run the production server
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3000

CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]