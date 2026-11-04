# Node.js 24 LTS (supported until April 2028)
FROM node:24-bookworm-slim

WORKDIR /usr/src/app

# curl is used by the health check. sharp and ffmpeg ship prebuilt binaries,
# so no compiler toolchain is needed.
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install production dependencies exactly as locked
COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .
# Disk uploads land in ./uploads, which the app user must be able to write
RUN mkdir -p uploads && chown node:node uploads

ENV NODE_ENV=production
ENV PORT=8000
ENV MONGODB_CONNECTION_RETRIES=5
ENV MONGODB_RETRY_INTERVAL=5000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run as the unprivileged user that the node image provides
USER node

CMD [ "node", "server.js" ]
