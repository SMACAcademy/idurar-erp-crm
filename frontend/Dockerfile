# Frontend Dockerfile for IDURAR ERP CRM (Vite React)
# Uses Node.js 20.9.0 for build and Nginx for static hosting

FROM node:20.9.0-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build-time configuration for Vite
# Pass values via --build-arg to bake correct API URLs into the static build
ARG VITE_BACKEND_SERVER
ARG VITE_FILE_BASE_URL
ARG VITE_DEV_REMOTE=remote
ENV VITE_BACKEND_SERVER=${VITE_BACKEND_SERVER}
ENV VITE_FILE_BASE_URL=${VITE_FILE_BASE_URL}
ENV VITE_DEV_REMOTE=${VITE_DEV_REMOTE}

# Build static assets
RUN npm run build

# Runtime image
FROM nginx:1.25-alpine

# Copy built assets to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP
EXPOSE 80

# Default command
CMD ["nginx", "-g", "daemon off;"]