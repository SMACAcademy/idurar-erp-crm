from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pymongo import MongoClient
from pydantic import BaseModel
from typing import List, Dict, Any
import os
from datetime import datetime
import secrets
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="IDURAR ERP-CRM Integration API", version="1.0.0")

# Security
security = HTTPBasic()

# Environment variables
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/idurar_db")
API_USERNAME = os.getenv("API_USERNAME", "admin")
API_PASSWORD = os.getenv("API_PASSWORD", "password")

# MongoDB client
client = MongoClient(MONGODB_URI)
db = client.idurar_db

# Pydantic models
class WebhookData(BaseModel):
    source: str
    event: str
    data: Dict[str, Any]
    timestamp: datetime = None

class SummaryResponse(BaseModel):
    query_counts_by_status: Dict[str, int]
    invoice_totals_by_month: List[Dict[str, Any]]
    total_clients: int
    total_invoices: int

# Authentication
def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, API_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, API_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@app.get("/")
async def root():
    return {"message": "IDURAR Integration API", "version": "1.0.0"}

@app.get("/integration/reports/summary", response_model=SummaryResponse)
async def get_reports_summary(username: str = Depends(authenticate)):
    try:
        # Query counts by status
        query_pipeline = [
            {"$match": {"removed": False}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        query_counts = {}
        for doc in db.queries.aggregate(query_pipeline):
            query_counts[doc["_id"]] = doc["count"]

        # Invoice totals by month
        invoice_pipeline = [
            {"$match": {"removed": False}},
            {"$group": {
                "_id": {
                    "year": {"$year": "$date"},
                    "month": {"$month": "$date"}
                },
                "total": {"$sum": "$total"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.year": -1, "_id.month": -1}}
        ]
        invoice_totals = []
        for doc in db.invoices.aggregate(invoice_pipeline):
            invoice_totals.append({
                "year": doc["_id"]["year"],
                "month": doc["_id"]["month"],
                "total_amount": doc["total"],
                "invoice_count": doc["count"]
            })

        # Total counts
        total_clients = db.clients.count_documents({"removed": False})
        total_invoices = db.invoices.count_documents({"removed": False})

        return SummaryResponse(
            query_counts_by_status=query_counts,
            invoice_totals_by_month=invoice_totals,
            total_clients=total_clients,
            total_invoices=total_invoices
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/integration/webhook")
async def receive_webhook(data: WebhookData, username: str = Depends(authenticate)):
    try:
        # Set timestamp if not provided
        if data.timestamp is None:
            data.timestamp = datetime.utcnow()

        # Insert into webhooks collection
        result = db.webhooks.insert_one(data.dict())

        return {
            "message": "Webhook received successfully",
            "webhook_id": str(result.inserted_id),
            "timestamp": data.timestamp
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing webhook: {str(e)}")

@app.get("/integration/clients")
async def get_clients(limit: int = 100, skip: int = 0, username: str = Depends(authenticate)):
    try:
        clients = []
        cursor = db.clients.find({"removed": False}).skip(skip).limit(limit)
        for client in cursor:
            client["_id"] = str(client["_id"])
            clients.append(client)

        return {"clients": clients, "count": len(clients)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/integration/invoices")
async def get_invoices(limit: int = 100, skip: int = 0, username: str = Depends(authenticate)):
    try:
        invoices = []
        cursor = db.invoices.find({"removed": False}).skip(skip).limit(limit)
        for invoice in cursor:
            invoice["_id"] = str(invoice["_id"])
            invoices.append(invoice)

        return {"invoices": invoices, "count": len(invoices)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/integration/queries")
async def get_queries(limit: int = 100, skip: int = 0, username: str = Depends(authenticate)):
    try:
        queries = []
        cursor = db.queries.find({"removed": False}).skip(skip).limit(limit)
        for query in cursor:
            query["_id"] = str(query["_id"])
            queries.append(query)

        return {"queries": queries, "count": len(queries)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)