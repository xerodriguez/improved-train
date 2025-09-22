# Northwind Products Service

A TypeScript microservice for managing products from the Northwind database using Express.js and PostgreSQL.

## Features

- **RESTful API** for products management
- **PostgreSQL integration** with connection pooling
- **Type-safe** TypeScript implementation
- **Comprehensive error handling** with structured responses
- **Unit testing** with Jest and proper mocking
- **Graceful shutdown** handling
- **Security middleware** (CORS, Helmet)
- **Request logging** and monitoring

## API Endpoints

### Products

- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/:id` - Get product by ID
- `GET /api/v1/products?category=:categoryId` - Get products by category
- `GET /api/v1/products?supplier=:supplierId` - Get products by supplier
- `GET /health` - Health check endpoint

## Database Schema

The service consumes the following PostgreSQL table structure:

```sql
CREATE TABLE products (
    product_id smallint NOT NULL,
    product_name character varying(40) NOT NULL,
    supplier_id smallint,
    category_id smallint,
    quantity_per_unit character varying(20),
    unit_price real,
    units_in_stock smallint,
    units_on_order smallint,
    reorder_level smallint,
    discontinued integer NOT NULL
);
```

## Setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database with Northwind schema
- npm or yarn package manager

### Installation

1. Navigate to the products service directory:
   ```bash
   cd services/products
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Update environment variables in `.env`:
   ```env
   PORT=3002
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=northwind
   ```

### Running the Service

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

### Testing

#### Run all tests
```bash
npm test
```

#### Run tests in watch mode
```bash
npm run test:watch
```

#### Generate coverage report
```bash
npm run test:coverage
```

## Project Structure

```
src/
├── controllers/        # HTTP request handlers
├── services/          # Business logic layer
├── repositories/      # Data access layer
├── routes/           # Express route definitions
├── types/            # TypeScript interfaces
├── database/         # Database connection and utilities
├── __tests__/        # Unit tests
└── index.ts          # Application entry point
```

## API Response Format

All API responses follow a consistent structure:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Success Response Example
```json
{
  "success": true,
  "data": [
    {
      "product_id": 1,
      "product_name": "Chai",
      "supplier_id": 1,
      "category_id": 1,
      "quantity_per_unit": "10 boxes x 20 bags",
      "unit_price": 18.0,
      "units_in_stock": 39,
      "units_on_order": 0,
      "reorder_level": 10,
      "discontinued": 0
    }
  ],
  "message": "Retrieved 1 products successfully"
}
```

### Error Response Example
```json
{
  "success": false,
  "error": "Product with ID 999 not found"
}
```

## Architecture

The service follows a layered architecture pattern:

1. **Controller Layer** - Handles HTTP requests/responses
2. **Service Layer** - Contains business logic and validation
3. **Repository Layer** - Handles data access and database queries
4. **Database Layer** - Manages PostgreSQL connections and pooling

## Error Handling

- **Validation errors** return 400 Bad Request
- **Not found errors** return 404 Not Found
- **Database errors** are logged and return 500 Internal Server Error
- **Network errors** are properly caught and handled

## Security

- **Helmet.js** for security headers
- **CORS** configuration for cross-origin requests
- **Input validation** and sanitization
- **SQL injection** protection through parameterized queries

## Monitoring

- Health check endpoint at `/health`
- Request logging with timestamps
- Database query logging with execution time
- Graceful shutdown handling for SIGTERM/SIGINT