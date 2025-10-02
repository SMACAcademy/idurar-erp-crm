# Stage 1: Build the React (Vite) app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and lock file first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built files to nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional)
# If you need SPA routing support, create nginx.conf and copy:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
