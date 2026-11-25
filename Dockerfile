
# Base image: match the project's Node version
FROM node:22.17.0-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1

# Install system tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-venv \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp in an isolated Python environment
RUN python3 -m venv /opt/yt-dlp \
    && /opt/yt-dlp/bin/pip install --no-cache-dir --upgrade pip yt-dlp

ENV PATH="/opt/yt-dlp/bin:${PATH}"

# Install the exact pnpm version used by the project
RUN corepack enable \
    && corepack prepare pnpm@10.14.0 --activate

WORKDIR /app

# Dependencies
COPY package.json pnpm-lock.yaml ./

FROM base AS dependencies
RUN pnpm install --frozen-lockfile

# Build
FROM base AS build

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# Production runner
FROM base AS runner

ENV NODE_ENV=production
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

RUN mkdir -p /app/uploads \
    && chown -R nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 10000

CMD ["node", "server.js"]
