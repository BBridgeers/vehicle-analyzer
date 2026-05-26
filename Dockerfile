# Stage 1: Build Next.js
FROM node:24-alpine AS builder

WORKDIR /app

# Copy only needed files for build
COPY package*.json ./
COPY next.config.ts ./
COPY tsconfig.json ./
COPY src ./src
COPY public ./public
COPY .env.local .env.local

# Install deps (skip optional for smaller image)
RUN npm ci --only=production

# Build
RUN npm run build

# Stage 2: Production (minimal runtime)
FROM node:24-alpine AS runner

WORKDIR /app

# Install nginx (reverse proxy)
RUN apk add --no-cache nginx

# Copy built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/scraper ./scraper

# Copy default nginx config (will be overridden by docker-compose bind mount)
RUN rm -f /etc/nginx/httpd.conf

EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]
