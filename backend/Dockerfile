# Development stage

FROM node:20-alpine AS dev

WORKDIR /app

COPY backend/package*.json ./

RUN npm install

COPY backend/ .

CMD ["npm", "run", "dev"]



# Production stage

FROM node:20-alpine AS production

WORKDIR /app

COPY backend/package*.json ./

RUN npm install --production

COPY backend/ .

CMD ["npm", "start"]


