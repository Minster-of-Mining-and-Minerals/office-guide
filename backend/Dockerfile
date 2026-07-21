# Build from repository root:
#   docker compose build backend
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci

COPY backend/ ./

RUN mkdir -p uploads public/uploads

COPY backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4001 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:4001/', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "app.js"]