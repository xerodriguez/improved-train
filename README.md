# Northwind Microservices Architecture

A modern microservices implementation of the classic Northwind database using TypeScript, Express.js, PostgreSQL, and Keycloak authentication.

## Architecture Overview

This project implements a microservices architecture with the following components:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Client    │    │   Mobile App     │    │  External APIs  │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │       API Gateway          │
                    │    (Port 3000)             │
                    │  - JWT Authentication      │
                    │  - Request Routing         │
                    │  - Rate Limiting          │
                    └─────────────┬──────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼────────┐    ┌─────────▼────────┐    ┌─────────▼────────┐
│ Products Service │    │ Suppliers Service│    │  Users Service   │
│   (Port 3002)    │    │   (Port 3003)    │    │   (Port 3004)    │
│ - Product CRUD   │    │ - Supplier CRUD  │    │ - User Management│
│ - Inventory Mgmt │    │ - Contact Info   │    │ - Profile Data   │
└────────┬────────┘    └─────────┬────────┘    └─────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │    PostgreSQL Database     │
                    │      (Port 5432)           │
                    │    - Northwind Schema      │
                    │    - Shared Data Store     │
                    └────────────────────────────┘

                    ┌─────────────────────────────┐
                    │     Keycloak Server         │
                    │      (Port 8080)            │
                    │   - JWT Authentication      │
                    │   - User Management         │
                    │   - Role-Based Access       │
                    └─────────────────────────────┘
```

## Services

### 🚪 API Gateway (Port 3000)
- **Authentication**: JWT token validation with Keycloak
- **Routing**: Intelligent request forwarding to microservices
- **Security**: CORS, Helmet, rate limiting
- **Monitoring**: Health checks and service discovery
- **Error Handling**: Unified error responses and 502 handling

### 📦 Products Service (Port 3002)
- **Database Integration**: PostgreSQL with connection pooling
- **REST API**: Full CRUD operations for products
- **Business Logic**: Inventory management and product categorization
- **Testing**: Comprehensive unit tests with Jest
- **TypeScript**: Fully typed interfaces and error handling

### 🏢 Suppliers Service (Port 3003)
- **Placeholder**: Ready for supplier management implementation
- **Future Features**: Contact information, performance metrics

### 👥 Users Service (Port 3004)
- **Placeholder**: Ready for user management implementation  
- **Future Features**: User profiles, preferences, history

## Database Schema

The project uses the classic Northwind database schema with the following key tables:

### Products Table
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

## API Endpoints

### Products API (via Gateway)
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID  
- `GET /api/products?category=:categoryId` - Filter by category
- `GET /api/products?supplier=:supplierId` - Filter by supplier

### System Endpoints
- `GET /health` - System health check
- `GET /info` - Service information

## Quick Start

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** 12+
- **Docker** (optional, for Keycloak)

### 1. Database Setup
```bash
# Create Northwind database
createdb northwind
psql northwind < northwind.sql
```

### 2. Keycloak Setup (Docker)
```bash
# Start Keycloak container
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev

# Import realm configuration
# Access: http://localhost:8080
# Import: keycloak/realms/myrealm.json
```

### 3. Services Installation

#### Products Service
```bash
cd services/products
npm install
cp .env.example .env
# Edit .env with database credentials
npm run dev
```

#### API Gateway
```bash
cd services/api-gateway  
npm install
cp .env.example .env
# Edit .env with service URLs and Keycloak settings
npm run dev
```

### 4. Testing the API

Get a JWT token from Keycloak and test the endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Products (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/products
```

## Development

### Running Services
```bash
# Terminal 1 - Products Service
cd services/products && npm run dev

# Terminal 2 - API Gateway  
cd services/api-gateway && npm run dev

# Terminal 3 - Additional services as needed
```

### Testing
```bash
# Products service tests
cd services/products && npm test

# API Gateway tests (future implementation)
cd services/api-gateway && npm test
```

### Docker Compose (Optional)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Security

- **JWT Authentication**: All API requests require valid Keycloak tokens
- **HTTPS Ready**: SSL/TLS configuration for production
- **Input Validation**: Comprehensive request validation and sanitization
- **SQL Injection Protection**: Parameterized queries throughout
- **CORS Configuration**: Controlled cross-origin access

## Monitoring & Observability

- **Health Checks**: Each service exposes `/health` endpoints
- **Request Logging**: Comprehensive logging with request IDs
- **Error Tracking**: Structured error responses and logging
- **Service Discovery**: Dynamic service status monitoring

## Production Deployment

### Environment Configuration
- Set `NODE_ENV=production`
- Configure proper database credentials
- Set up SSL certificates
- Configure production Keycloak realm
- Set appropriate CORS origins

### Scaling Considerations
- **Load Balancing**: Use NGINX or similar for the API Gateway
- **Database Pooling**: PostgreSQL connection pooling configured
- **Caching**: Redis integration ready for implementation
- **Container Orchestration**: Kubernetes manifests available

## Contributing

1. **Code Style**: ESLint and Prettier configured
2. **Testing**: Minimum 80% code coverage required
3. **Documentation**: Update README files for changes
4. **Type Safety**: Full TypeScript coverage maintained

## Project Structure

```
├── services/
│   ├── api-gateway/          # Gateway service
│   │   ├── src/
│   │   │   ├── middleware/   # Auth and security
│   │   │   ├── routes/       # API routes
│   │   │   ├── utils/        # Service proxy
│   │   │   └── index.ts      # Entry point
│   │   └── package.json
│   ├── products/             # Products microservice
│   │   ├── src/
│   │   │   ├── controllers/  # HTTP handlers
│   │   │   ├── services/     # Business logic
│   │   │   ├── repositories/ # Data access
│   │   │   ├── types/        # TypeScript interfaces
│   │   │   ├── database/     # DB connection
│   │   │   └── __tests__/    # Unit tests
│   │   └── package.json
│   ├── suppliers/            # Future implementation
│   └── users/                # Future implementation
├── keycloak/
│   └── realms/
│       └── myrealm.json      # Keycloak configuration
├── docker-compose.yml        # Container orchestration
├── Dockerfile               # Multi-stage build
├── northwind.sql            # Database schema
└── README.md               # This file
```

## License

MIT License - see LICENSE file for details.
