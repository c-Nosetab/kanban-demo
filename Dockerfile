# Multi-stage build for production
FROM node:20-alpine AS backend-builder

# Build backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production image
FROM node:20-alpine

# Install nginx
RUN apk add --no-cache nginx

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy backend
WORKDIR /app/backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/package*.json ./
RUN npm ci --only=production

# Copy frontend
WORKDIR /app/frontend
COPY --from=frontend-builder /app/frontend/dist ./dist

# Copy start script
WORKDIR /app
COPY start.sh ./
RUN chmod +x start.sh

# Create nginx directories
RUN mkdir -p /var/log/nginx /var/lib/nginx

EXPOSE 80 3000

CMD ["./start.sh"]
