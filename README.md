# IDURAR ERP CRM — Monorepo README

This README documents the modules currently present in the repository and provides setup, environment, Docker, deployment, testing, and example requests.

Included modules:
- Express + MongoDB backend (MERN)
- Vite React frontend
- Python FastAPI Integration API

Key source references:
- Backend server bootstrap: [backend/src/server.js](backend/src/server.js)
- App wiring and routes: [backend/src/app.js](backend/src/app.js)
- Auto/custom routes: [backend/src/routes/appRoutes/mainAppApi.js](backend/src/routes/appRoutes/mainAppApi.js)
- Public APIs: [backend/src/routes/appRoutes/paymentPublicApi.js](backend/src/routes/appRoutes/paymentPublicApi.js), [backend/src/routes/appRoutes/invoicePublicApi.js](backend/src/routes/appRoutes/invoicePublicApi.js), [backend/src/routes/appRoutes/publicAppApi.js](backend/src/routes/appRoutes/publicAppApi.js), [backend/src/routes/appRoutes/referencePublicApi.js](backend/src/routes/appRoutes/referencePublicApi.js)
- Frontend dev proxy: [frontend/vite.config.js](frontend/vite.config.js)
- Frontend API base: [frontend/src/config/serverApiConfig.js](frontend/src/config/serverApiConfig.js)
- Integration API (FastAPI): [integration-api/main.py](integration-api/main.py)

Syntax-level references:
- Mongo connect: [mongoose.connect()](backend/src/server.js:20)
- Server port: [app.set('port', ...)](backend/src/server.js:42) and [app.listen()](backend/src/server.js:43)
- Protected routers: [app.use('/api', adminAuth.isValidAuthToken, ...)](backend/src/app.js:56)
- Queries routes: [router.get('/queries')](backend/src/routes/appRoutes/mainAppApi.js:63)
- Notes routes: [router.post('/queries/:id/notes')](backend/src/routes/appRoutes/mainAppApi.js:70)
- Payment public: [router.get('/payment/list')](backend/src/routes/appRoutes/paymentPublicApi.js:17)
- Invoice email: [router.post('/invoice/mail')](backend/src/routes/appRoutes/invoicePublicApi.js:15)
- Public clients: [router.get('/clients')](backend/src/routes/appRoutes/publicAppApi.js:13)
- Reference lists: [router.get('/paymentMode/list/all')](backend/src/routes/appRoutes/referencePublicApi.js:10), [router.get('/taxes/list/all')](backend/src/routes/appRoutes/referencePublicApi.js:15)
- Frontend API base: [API_BASE_URL](frontend/src/config/serverApiConfig.js:11)
- Integration summary: [@app.get('/integration/reports/summary')](integration-api/main.py:57)
- Integration webhook: [@app.post('/integration/webhook')](integration-api/main.py:104)

Architecture

Client (React SPA) -> Express API (Mongoose) -> MongoDB
Client (React SPA) -> Integration API (PyMongo) -> MongoDB

1) Project Overview

- Backend (Express + MongoDB)
  - Loads environment, connects to Mongo, auto-registers models, and starts HTTP.
  - Wires public and protected routers in the app entry.
  - Exposes CRUD and custom endpoints for ERP modules, plus public endpoints for payments, clients, taxes, and invoice emailing.

- Frontend (Vite React)
  - Vite dev server with proxy to backend for /api.
  - API base and download base computed from environment with safe trailing slashes.

- Integration API (FastAPI)
  - Secure HTTP Basic authentication.
  - Summary reporting aggregates, webhook ingestion, and export endpoints.

2) Prerequisites

- Node.js v20.9.0 and npm v10.2.4 (per engines in [backend/package.json](backend/package.json) and [frontend/package.json](frontend/package.json))
- Docker 24+ and Docker Compose v2
- MongoDB 6.x/7.x (local or Atlas)
- Optional: kubectl and a Kubernetes cluster (kind/k3d/Docker Desktop/EKS/GKE/AKS)

3) Environment Variables

Backend (Express)
- MONGODB_URI — Mongo connection string used by [mongoose.connect()](backend/src/server.js:20)
- PORT — server port, set via [app.set('port', ...)](backend/src/server.js:42)
- NODE_ENV — development | production
- JWT_SECRET — for auth flows if used
- OPENAI_API_KEY — available in codebase for AI features
- GEMINI_API_KEY — for @google/generative-ai features
- AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_S3_REGION — optional object storage
- RESEND_API_KEY — optional email provider

Frontend (Vite)
- VITE_BACKEND_SERVER — e.g. http://localhost:5000/ (ensure trailing slash), see [serverApiConfig](frontend/src/config/serverApiConfig.js:6)
- VITE_FILE_BASE_URL — e.g. http://localhost:5000/files/, see [FILE_BASE_URL](frontend/src/config/serverApiConfig.js:21)
- VITE_DEV_REMOTE — local | remote; affects proxy target in [vite.config](frontend/vite.config.js:10)

Integration API (FastAPI)
- MONGODB_URI — e.g. mongodb://127.0.0.1:27017/idurar_db (see [integration-api/main.py](integration-api/main.py:20))
- API_USERNAME — HTTP Basic user (see [integration-api/main.py](integration-api/main.py:21))
- API_PASSWORD — HTTP Basic password (see [integration-api/main.py](integration-api/main.py:22))
- PORT — 8000 (uvicorn CLI) or 8002 when using [uvicorn.run()](integration-api/main.py:162)

Example .env files

backend/.env
```
MONGODB_URI=mongodb://mongo:27017/idurar_db
PORT=5000
NODE_ENV=development
JWT_SECRET=supersecret
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
AWS_S3_REGION=...
RESEND_API_KEY=...
```

frontend/.env
```
VITE_BACKEND_SERVER=http://localhost:5000/
VITE_FILE_BASE_URL=http://localhost:5000/files/
VITE_DEV_REMOTE=local
```

integration-api/.env
```
MONGODB_URI=mongodb://host.docker.internal:27017/idurar_db
API_USERNAME=admin
API_PASSWORD=securepassword123
PORT=8000
```

4) Local Development

Backend
```
cd backend
npm ci
npm run dev
```
- Default dev port 8888 per [vite dev proxy target](frontend/vite.config.js:12,26) if PORT not set.

Frontend
```
cd frontend
npm ci
npm run dev
```
- Dev server: http://localhost:3000 with proxy /api -> backend per [vite.config.js](frontend/vite.config.js:26).

Integration API
```
cd integration-api
pip install -r requirements.txt
python main.py  # uses [uvicorn.run()](integration-api/main.py:162) at 8002
# or
uvicorn main:app --reload --port 8000
```

5) Docker — Build and Run

Express Backend (proposed backend/Dockerfile)
```dockerfile
FROM node:20.9.0-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
CMD ["node","src/server.js"]
```
```
docker build -t yourorg/idurar-backend:latest -f backend/Dockerfile backend
docker run --rm -p 5000:5000 --env-file backend/.env yourorg/idurar-backend:latest
```

Frontend (proposed frontend/Dockerfile)
```dockerfile
FROM node:20.9.0-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
```
```
docker build -t yourorg/idurar-frontend:latest -f frontend/Dockerfile frontend
docker run --rm -p 3000:80 -e VITE_BACKEND_SERVER=http://localhost:5000/ yourorg/idurar-frontend:latest
```

Integration API (existing Dockerfile)
- Dockerfile: [integration-api/Dockerfile](integration-api/Dockerfile)
- Compose (module-local): [integration-api/docker-compose.yml](integration-api/docker-compose.yml)
```
cd integration-api
docker compose up --build
# API: http://localhost:8000 | Docs: http://localhost:8000/docs
```

6) Orchestrate with docker-compose (root) — optional

Create docker-compose.yml at repo root:
```yaml
version: "3.9"
services:
  mongo:
    image: mongo:7.0
    restart: unless-stopped
    ports: ["27017:27017"]
    volumes:
      - mongo_data:/data/db

  backend:
    build: { context: ./backend, dockerfile: Dockerfile }
    env_file: ./backend/.env
    environment:
      MONGODB_URI: mongodb://mongo:27017/idurar_db
      PORT: 5000
    depends_on: [mongo]
    ports: ["5000:5000"]

  frontend:
    build: { context: ./frontend, dockerfile: Dockerfile }
    environment:
      VITE_BACKEND_SERVER: http://backend:5000/
    depends_on: [backend]
    ports: ["3000:80"]

  integration-api:
    build: { context: ./integration-api, dockerfile: Dockerfile }
    environment:
      MONGODB_URI: mongodb://mongo:27017/idurar_db
      API_USERNAME: admin
      API_PASSWORD: securepassword123
    depends_on: [mongo]
    ports: ["8000:8000"]

volumes:
  mongo_data:
```
```
docker compose up --build
```

7) Deployment

Push images to a registry (Docker Hub example)
```
docker login
docker tag yourorg/idurar-backend:latest yourhubuser/idurar-backend:1.0.0
docker push yourhubuser/idurar-backend:1.0.0
```


8) Testing

Backend (Express)
```
cd backend
npm ci
# add tests and run
npm test
```

Frontend (Vite React)
```
cd frontend
npm ci
# add vitest/rtl then run
npm test
```

Integration API (FastAPI)
```
cd integration-api
pip install -r requirements.txt
# add pytest then run
pytest -q
```

9) Example Requests

Express Backend — Queries
```
curl -X GET "http://localhost:5000/api/queries"
```
```
curl -X POST "http://localhost:5000/api/queries" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Inquiry","description":"Details here"}'
```
```
curl -X GET "http://localhost:5000/api/queries/QUERY_ID"
```
```
curl -X PUT "http://localhost:5000/api/queries/QUERY_ID" \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved"}'
```
```
curl -X DELETE "http://localhost:5000/api/queries/QUERY_ID"
```

Express Backend — Notes
```
curl -X POST "http://localhost:5000/api/queries/QUERY_ID/notes" \
  -H "Content-Type: application/json" \
  -d '{"text":"A note"}'
```
```
curl -X DELETE "http://localhost:5000/api/queries/QUERY_ID/notes/NOTE_ID"
```

Public APIs — Clients
```
curl -X GET "http://localhost:5000/public-api/clients"
```
```
curl -X GET "http://localhost:5000/public-api/clients/all"
```

Public APIs — Payments
```
curl -X GET "http://localhost:5000/api/payment/list"
```
```
curl -X GET "http://localhost:5000/api/payment/summary"
```

Public APIs — Reference
```
curl -X GET "http://localhost:5000/api/paymentMode/list/all"
```
```
curl -X GET "http://localhost:5000/api/taxes/list/all"
```

Public APIs — Invoice Email
```
curl -X POST "http://localhost:5000/api/invoice/mail" \
  -H "Content-Type: application/json" \
  -d '{"invoiceId":"INVOICE_ID","email":"client@example.com","subject":"Your invoice"}'
```

Integration API (HTTP Basic auth required: admin/securepassword123)
```
curl -u admin:securepassword123 "http://localhost:8000/integration/reports/summary"
```
```
curl -X POST -u admin:securepassword123 \
  -H "Content-Type: application/json" \
  -d '{"source":"external","event":"customer_created","data":{"customer_id":"123"}}' \
  "http://localhost:8000/integration/webhook"
```
```
curl -u admin:securepassword123 "http://localhost:8000/integration/clients?limit=50"
```
```
curl -u admin:securepassword123 "http://localhost:8000/integration/invoices?limit=50"
```
```
curl -u admin:securepassword123 "http://localhost:8000/integration/queries?limit=50"
```

10) Troubleshooting

- Ensure backend URL has a trailing slash; see [BACKEND_BASE](frontend/src/config/serverApiConfig.js:9).
- If Mongo connection fails, verify [MONGODB_URI](backend/src/server.js:19) and network.
- Confirm frontend dev proxy target in [vite.config.js](frontend/vite.config.js:12,26).
- For Docker on macOS/Windows, use host.docker.internal to access host Mongo from container.

11) License

This project is part of the IDURAR ERP-CRM system. See repository license metadata.
