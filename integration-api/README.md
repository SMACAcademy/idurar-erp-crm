# IDURAR ERP-CRM Integration API

A FastAPI-based integration layer for the IDURAR ERP-CRM system, providing advanced reporting and external system integration capabilities.

## Features

- **Advanced Reporting**: Aggregated data insights from customers, invoices, and queries
- **Webhook Integration**: Receive and process data from external systems
- **Data Export**: Access to customer, invoice, and query data
- **Secure Authentication**: HTTP Basic Auth protection
- **Docker Ready**: Containerized for easy deployment

## Quick Start

### Local Development

1. **Install Dependencies**
   ```bash
   cd integration-api
   pip install -r requirements.txt
   ```

2. **Run the API**
   ```bash
   python main.py
   ```

3. **Access the API**
   - OpenAPI Documentation: http://localhost:8000/docs
   - API Root: http://localhost:8000/

### Docker Deployment

1. **Build and Run**
   ```bash
   docker-compose up --build
   ```

2. **Access the API**
   - API: http://localhost:8000
   - Documentation: http://localhost:8000/docs

## API Endpoints

### Authentication
All endpoints require HTTP Basic Authentication:
- Username: `admin` (configurable via `API_USERNAME`)
- Password: `securepassword123` (configurable via `API_PASSWORD`)

### Endpoints

#### GET /
Basic API information and health check.

#### GET /integration/reports/summary
Returns aggregated reporting data:
- Query counts by status
- Invoice totals by month
- Total client and invoice counts

**Response:**
```json
{
  "query_counts_by_status": {"Open": 5, "Closed": 10},
  "invoice_totals_by_month": [
    {"year": 2024, "month": 9, "total_amount": 15000.0, "invoice_count": 3}
  ],
  "total_clients": 25,
  "total_invoices": 45
}
```

#### POST /integration/webhook
Accepts webhook data from external systems.

**Request Body:**
```json
{
  "source": "external_system",
  "event": "customer_created",
  "data": {"customer_id": "123", "name": "John Doe"},
  "timestamp": "2024-09-19T10:00:00Z"
}
```

#### GET /integration/clients
Retrieve client data with pagination.

**Query Parameters:**
- `limit`: Number of records (default: 100)
- `skip`: Number of records to skip (default: 0)

#### GET /integration/invoices
Retrieve invoice data with pagination.

#### GET /integration/queries
Retrieve query data with pagination.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/idurar_db` | MongoDB connection string |
| `API_USERNAME` | `admin` | Basic auth username |
| `API_PASSWORD` | `securepassword123` | Basic auth password |
| `PORT` | `8000` | API server port |

### Docker Environment

For Docker deployment, update the MongoDB URI to connect to the host:
```env
MONGODB_URI=mongodb://host.docker.internal:27017/idurar_db
```

## Database Schema

The API interacts with the following MongoDB collections:
- `clients`: Customer information
- `invoices`: Invoice records
- `queries`: Support queries
- `webhooks`: Incoming webhook data

## Security

- HTTP Basic Authentication on all endpoints
- Input validation using Pydantic models
- CORS enabled for cross-origin requests
- Non-root Docker user for security

## Development

### Testing the API

```bash
# Test with curl
curl -u admin:securepassword123 http://localhost:8000/integration/reports/summary

# Test webhook
curl -X POST -u admin:securepassword123 \
  -H "Content-Type: application/json" \
  -d '{"source":"test","event":"test_event","data":{"key":"value"}}' \
  http://localhost:8000/integration/webhook
```

### Adding New Endpoints

1. Define Pydantic models in `main.py`
2. Add route handlers with authentication dependency
3. Update this README with new endpoint documentation

## Deployment Options

### Local Docker
```bash
docker-compose up -d
```

### Cloud Deployment
- **AWS ECS**: Use the Dockerfile with ECS task definitions
- **Google Cloud Run**: Deploy the container image
- **Azure Container Instances**: Use ACI for serverless containers
- **Kubernetes**: Use the Docker image in K8s deployments

## Monitoring

- Health check endpoint: `GET /`
- Docker health checks configured
- Logs available via `docker-compose logs`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test
4. Submit a pull request

## License

This project is part of the IDURAR ERP-CRM system.