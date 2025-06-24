# Development Stage
FROM node:20-alpine AS dev
WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .

CMD ["npm", "run", "dev"]


# Build Stage
FROM node:20-alpine AS build
WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .

RUN npm run build

# Production Stage
FROM nginx:alpine AS prod

COPY --from=build /app/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]