# API Gateway Service

A secure API Gateway that provides authentication, request routing, and service orchestration for the Northwind microservices architecture.

## Features

- **JWT Authentication** with Keycloak integration
- **Service Discovery** and request forwarding
- **Rate Limiting** and security middleware
- **Health Monitoring** for downstream services
- **Request/Response logging** and tracing
- **Error handling** with proper HTTP status codes
- **CORS configuration** for web applications

## API Routes

All routes require JWT authentication via Keycloak.

### Products Service
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products?category=:categoryId` - Get products by category
- `GET /api/products?supplier=:supplierId` - Get products by supplier

### System Endpoints
- `GET /health` - Gateway and services health check
- `GET /info` - Gateway information and service URLs

## Authentication

The API Gateway uses Keycloak for JWT token validation:

1. **Authorization Header**: `Bearer <JWT_TOKEN>`
2. **Token Validation**: Verifies signature using Keycloak's public keys
3. **Role-Based Access**: Supports role-based authorization (future enhancement)

## Setup

### Prerequisites

- Node.js (v18 or higher)
- Keycloak server running on port 8080
- Downstream microservices (products, suppliers, users)

### Installation

1. Navigate to the API Gateway directory:
   ```bash
   cd services/api-gateway
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
   PORT=3000
   KEYCLOAK_SERVER_URL=http://localhost:8080
   KEYCLOAK_REALM=myrealm
   KEYCLOAK_CLIENT_ID=account
   PRODUCTS_SERVICE_URL=http://localhost:3002
   SUPPLIERS_SERVICE_URL=http://localhost:3003
   USERS_SERVICE_URL=http://localhost:3004
   ```

### Running the Gateway

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

## Service Configuration

The gateway is configured to route requests to the following services:

| Service | URL | Purpose |
|---------|-----|---------|
| Products | http://localhost:3002 | Product management |
| Suppliers | http://localhost:3003 | Supplier management |
| Users | http://localhost:3004 | User management |

## Request Flow

1. **Client Request** → API Gateway
2. **Authentication** → JWT token validation with Keycloak
3. **Authorization** → Role/permission checking (optional)
4. **Service Routing** → Forward to appropriate microservice
5. **Response Processing** → Return response to client

## Error Handling

### Authentication Errors
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Insufficient permissions

### Service Errors
- **502 Bad Gateway**: Target service unavailable
- **500 Internal Server Error**: Gateway processing error
- **404 Not Found**: Unknown route

### Error Response Format
```json
{
  "success": false,
  "error": "Service 'products' is currently unavailable",
  "code": "SERVICE_UNAVAILABLE",
  "requestId": "1234567890-abc123",
  "timestamp": "2025-09-21T10:30:00.000Z"
}
```

## Health Monitoring

The gateway provides comprehensive health monitoring:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "gateway": "healthy",
  "services": [
    {
      "service": "products",
      "status": "healthy",
      "url": "http://localhost:3002"
    },
    {
      "service": "suppliers",
      "status": "unhealthy",
      "url": "http://localhost:3003"
    }
  ],
  "timestamp": "2025-09-21T10:30:00.000Z",
  "version": "1.0.0"
}
```

## Security Features

- **Helmet.js**: Security headers protection
- **CORS**: Configurable cross-origin resource sharing
- **JWT Validation**: Cryptographic token verification
- **Request Tracing**: Unique request IDs for monitoring
- **Input Sanitization**: Header and parameter cleaning

## Logging

The gateway logs all requests with the following information:
- Request method and URL
- Response status and timing
- User authentication details
- Error details and stack traces
- Service forwarding information

## Architecture

```
Client Request
     ↓
API Gateway (Port 3000)
     ↓
Authentication Middleware
     ↓
Service Proxy Router
     ↓
Downstream Services
```

## Development

### Project Structure
```
src/
├── middleware/        # Authentication and security middleware
├── routes/           # API route definitions
├── utils/            # Service proxy and utilities
└── index.ts          # Application entry point
```

### Adding New Services

1. Update service configuration in `service-proxy.ts`
2. Add route definition in `api.routes.ts`
3. Update environment variables

### Testing Authentication

To test with a valid JWT token:

1. Obtain a token from Keycloak
2. Make requests with the Authorization header:
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        http://localhost:3000/api/products
   ```