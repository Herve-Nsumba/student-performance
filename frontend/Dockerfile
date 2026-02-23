# ── Stage 1: Build React app ──
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Frontend talks to Django through Nginx proxy (same origin)
ENV VITE_API_BASE_URL=""

COPY . .
RUN npm run build

# ── Stage 2: Serve with Nginx ──
FROM nginx:1.27-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
