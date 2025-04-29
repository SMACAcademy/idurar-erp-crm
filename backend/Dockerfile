FROM node:18

WORKDIR /app

# Copy package.json and package-lock.json separately to optimize layer caching
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend files
COPY backend/ .

EXPOSE 8888
CMD ["node", "index.js"]
