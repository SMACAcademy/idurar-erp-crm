# 🧩 Pente Task App – Fullstack Setup Guide

This repository contains both the **frontend** and **backend** of the Pente Task App. Follow the steps below to set up the development environment, configure environment variables, run the application locally or via Docker, and test the application.

---

## 🌐 Live Demo

▶️ **Video Demo**: [Click to Watch](https://drive.google.com/file/d/1HkLHoQAQtJsW0wL1duv4ACNlGwr-mDgP/view?usp=drive_link)

📎 **Pull Request Proof** (Includes Docker and Postman Images): [View PR](https://github.com/vishnu14279/idurar-erp-crm/pull/1)

---

## 🧪 Local Setup (Frontend + Backend)


```bash
1. Fork the Repository

- Fork the monorepo: [https://github.com/vishnu14279/idurar-erp-crm/](https://github.com/vishnu14279/idurar-erp-crm/)
- Then clone it locally:

git clone https://github.com/your-username/idurar-erp-crm.git
cd idurar-erp-crm
-------------------------------------------------------------------
2. Set Up Environment Variables
Create a .env file inside the backend folder with the following contents:

env

DATABASE="your_mongodb_uri"
RESEND_API="your_resend_api"
OPENAI_API_KEY="your_openai_api_key"
JWT_SECRET="your_private_jwt_secret_key"
NODE_ENV="production"
OPENSSL_CONF="/dev/null"
PUBLIC_SERVER_FILE="http://localhost:8888/"
GEMINI_API_KEY="your_gemini_api_key"
------------------------------------------------------------------------
3. Install Dependencies
Install dependencies in both frontend and backend directories:

bash

cd backend
command-> npm install

command-> cd ../frontend
command-> npm install
-------------------------------------------------------------------------
4. Start the Application
Start both frontend and backend servers:

bash

# In backend folder
command-> npm run dev

# In frontend folder (new terminal)
command-> npm run dev
Your backend server and React frontend should now be running locally.

👤 Create a Default User
To seed the database with an initial user, run the following command from the backend folder:
bash

command-> node Src/setup/setup.js
-------------------------------------------------------------
🐳 Docker Deployment Guide
📦 Backend Docker Setup
bash

command-> cd backend
command-> docker build -t pente-backend .
command-> docker run -d -p 8888:8888 --env-file .env pente-backend

--------------------------------------------------------------
🌐 Frontend Docker Setup
bash

command-> cd frontend
command-> docker build -t pente-frontend .
command-> docker run -d -p 3000:3000 pente-frontend
-------------------------------------------------------------
✅ Testing
Use Postman to test API endpoints.

Refer to the PR link for screenshots of Postman test cases and Docker deployment.

Ensure your MongoDB connection string is active and working before launching the backend.
