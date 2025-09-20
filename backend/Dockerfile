# Backend Dockerfile for IDURAR ERP CRM (Express + Mongo)
# Uses Node.js 20.9.0 as required by engines

FROM node:20.9.0-alpine

# Set working directory
WORKDIR /app

# Set production environment early for smaller installs
ENV NODE_ENV=production

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose backend port (configurable via PORT env)
EXPOSE 5000
ENV PORT=5000

# Start the server
CMD ["node", "src/server.js"]