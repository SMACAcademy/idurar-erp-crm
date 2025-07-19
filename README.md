# CRM ERP

A modern, open-source CRM and ERP platform.

![CRM ERP Platform](https://github.com/user-attachments/assets/ebed2eba-5fd8-4d5f-a3ae-693af149f41d)

---

## Generate Summary button for invoice item notes, powered by Gemini!

---

## Overview of Modules

- **AuthModule**: Handles authentication, registration, and user management.
- **CrudModule**: Generic CRUD operations for various entities.
- **AdminCrudModule**: Admin-specific CRUD operations and management.
- **AdvancedCrudModule**: Advanced CRUD features for complex data.
- **ErpPanelModule**: Core ERP panel for managing business processes.
- **InvoiceModule**: Invoice creation, management, and payment tracking.
- **OfferModule**: Manage business offers and proposals.
- **OrderModule**: Order management and processing.
- **PaymentModule**: Payment records and processing.
- **ProfileModule**: User profile and settings.
- **QuoteModule**: Manage and generate business quotes.
- **SettingModule**: Application and company settings.
- **DashboardModule**: Business analytics and dashboard.
- **EmailModule**: Email templates and sending.

---

## Prerequisites & Setup

- **Node.js** (v16+ recommended)
- **npm** or **yarn**
- **Docker** (for containerized setup)

### 1. Clone the repository
```sh
git clone https://github.com/your-org/crm-erp.git
cd crm-erp
```

### 2. Install dependencies
```sh
cd frontend
npm install
cd ../backend
npm install
```

---

## Environment Variables

Create a `.env` or `temp.env` file in both `frontend/` and `backend/` directories. Example variables:

### Frontend (`frontend/.env` or `frontend/temp.env`)
```
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### Backend (`backend/.env`)
```
MONGO_URI=mongodb://localhost:27017/crm-erp
JWT_SECRET=your-secret
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
```

---

## Running with Docker

### 1. Build and start all services
```sh
docker-compose up --build
```

### 2. Run frontend only
```sh
cd frontend
docker build -t crm-erp-frontend .
docker run -p 3000:3000 crm-erp-frontend
```

### 3. Run backend only
```sh
cd backend
docker build -t crm-erp-backend .
docker run -p 5000:5000 crm-erp-backend
```

---

## Running Tests

### Frontend
```sh
cd frontend
npm test
```

### Backend
```sh
cd backend
npm test
```

---

## Example API Requests

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

### 2. Create Invoice
```http
POST /api/invoice
Content-Type: application/json
Authorization: Bearer <token>
{
  "client": "clientId",
  "items": [ ... ],
  "total": 1000
}
```

### 3. Get All Clients
```http
GET /api/client
Authorization: Bearer <token>
```

---
