# Invoice Management System

This document outlines the invoice management functionalities available in the system.

## API Endpoints

### List Invoices
- **GET** `/api/invoice/list` or `/api/invoice`
  - Lists all invoices with pagination
  - Query Parameters:
    - `page`: Page number (default: 1)
    - `items`: Items per page (default: 10)
    - `status`: Filter by status (optional)
  - Returns:
    - List of invoices with populated client and admin information
    - Pagination details (current page, total pages, total items)

### Create Invoice
- **POST** `/api/invoice`
  - Creates a new invoice
  - Required fields: number, client, date, dueDate, items
  - Optional fields: status, notes, taxRate


### Generate PDF
- **GET** `/api/invoice/:id/pdf`
  - Generates PDF version of the invoice
  - Query Parameters:
    - `preview`: Boolean - If true, generates preview data

### AI Summary Generation
- **POST** `/api/ai/invoice/summary`
  - Generates an AI summary of the invoice
  - Required fields: items, client, total, taxRate, taxTotal, subTotal, notes
  - Returns AI-generated summary text

## Frontend Features

### Invoice Form
- Create invoices
- Add/remove items dynamically
- Automatic calculation of totals
- Tax rate application
- Notes field
- Print preview and PDF view

### Print Preview
- Displays invoice in a printable format
- Shows all invoice details including:
  - Client information
  - Invoice number and dates
  - Item list with quantities and prices
  - Totals and tax calculations
  - Notes
  - AI-generated summary

### PDF Generation
- Generates downloadable PDF version
- Supports both saved and preview invoices

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

