# syntax=docker/dockerfile:1

FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
# Full deps: prisma CLI (migrate deploy) and ts-node (db seed) run at startup.
RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --include=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]
