
## Query Model

The Query model (`Query.js`) defines the following fields:

- `title`: String (required) - Title of the query
- `customer`: Reference to Customer model
- `status`: String enum ['pending', 'in_progress', 'resolved', 'closed'] - Current status of the query
- `description`: String (required) - Detailed description of the query
- `notes`: note objects containing:
  - `content`: String (required) - Note content  
- `createdBy`: Reference to Admin model

## API Endpoints

### List Queries
- **GET** `/api/query/list` 
  - Lists all queries with pagination
  - Query Parameters:
    - `page`: Page number (default: 1)
    - `items`: Items per page (default: 10)
  - Returns:
    - List of queries with populated customer and admin information
    - Pagination details (current page, total pages, total items)

### Create Query
- **POST** `/api/query`
  - Creates a new query
  - Required fields: title, description
  - Optional fields: customer, status

### Get Single Query
- **GET** `/api/query/:id`
  - Retrieves a single query by ID
  - Returns full query details with populated references

### Update Query
- **PUT** `/api/query/:id`
  - Updates an existing query
 

### Delete Query
- **DELETE** `/api/query/:id`
  - deletes a query 

### Notes Management
- **POST** `/api/query/:id/notes`
  - Adds a note to a query
  - Required field: content
- **DELETE** `/api/query/:id/notes/:noteId`
  - Deletes a specific note from a query

### Status Update
- **PUT** `/api/query/:id/status`
  - Updates the status of a query
  - Status must be one of: pending, in_progress, resolved, closed

## Authentication

All endpoints require authentication via JWT token. The token should be included in the request header as:
```
Authorization: Bearer <token>
```

## Response Format

Successful responses follow this format:
```json
{
  "success": true,
  "result": [/* data */],
  "pagination": {
    "page": 1,
    "pages": 5,
    "total": 50
  }
}
```

Error responses follow this format:
```json
{
  "success": false,
  "error": "Error message"
}
```


