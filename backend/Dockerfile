FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Use npm install instead of npm ci
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Create .env file
RUN echo 'DATABASE_URL="postgresql://idurar_admin:Venkatesh123!@idurar-erp-postgres.c544weocsbra.ap-south-1.rds.amazonaws.com:5432/idurar"' > .env
RUN echo 'NODE_ENV=production' >> .env
RUN echo 'PORT=5000' >> .env

EXPOSE 5000

# Start the app
CMD ["npm", "start"]
