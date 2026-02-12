FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
    BUNNY_STORAGE_ZONE=build \
    BUNNY_STORAGE_API_KEY=build \
    BUNNY_STORAGE_REGION=build \
    BUNNY_CDN_HOSTNAME=build \
    SESSION_SECRET=build \
    npm run build
RUN npm prune --production

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/migrate.js ./
COPY --from=builder /app/drizzle ./drizzle

EXPOSE 3000

USER node

CMD ["sh", "-c", "node migrate.js && node build"]
