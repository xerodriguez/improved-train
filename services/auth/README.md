# Authentication Service

A secure authentication service that integrates with Keycloak to provide JWT token-based authentication for the Northwind microservices architecture.

## Features

- **Keycloak Integration**: Uses Keycloak's Direct Access Grant flow for authentication
- **JWT Token Management**: Issues, refreshes, and validates JWT tokens
- **Comprehensive Error Handling**: Handles network issues, invalid credentials, and server errors
- **Input Validation**: Validates all request parameters with detailed error messages
- **Health Monitoring**: Monitors Keycloak server availability
- **Security Headers**: Implements security best practices with Helmet.js
- **Request Tracing**: Unique request IDs for monitoring and debugging
- **TypeScript**: Fully typed implementation with comprehensive interfaces

## API Endpoints

### Authentication

- `POST /auth/login` - Authenticate user and get JWT tokens
- `POST /auth/refresh` - Refresh access token using refresh token
- `POST /auth/logout` - Logout user and invalidate refresh token
- `GET /auth/validate` - Validate JWT token
- `GET /auth/health` - Service and Keycloak health check

### System

- `GET /health` - Service health check
- `GET /info` - Service information and configuration

## Request/Response Format

### Login Request
```json
{
  "username": "admin",
  "password": "admin"
}
```

### Successful Login Response
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 300,
    "refreshExpiresIn": 1800
  },
  "message": "Authentication successful",
  "timestamp": "2025-09-22T10:30:00.000Z",
  "requestId": "1234567890-abc123"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "Username or password is incorrect",
  "timestamp": "2025-09-22T10:30:00.000Z",
  "requestId": "1234567890-abc123"
}
```

### Token Refresh Request
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Token Validation
```bash
GET /auth/validate
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Logout Request
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Keycloak Configuration

The service is configured to work with the following Keycloak setup:

- **Server**: http://localhost:8080
- **Realm**: myrealm
- **Client ID**: backend
- **Client Secret**: secret
- **Grant Type**: Direct Access Grant (Resource Owner Password Credentials)

### Required Keycloak Client Settings

```json
{
  "clientId": "backend",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "secret": "secret",
  "directAccessGrantsEnabled": true,
  "standardFlowEnabled": false,
  "implicitFlowEnabled": false,
  "serviceAccountsEnabled": false,
  "publicClient": false,
  "protocol": "openid-connect"
}
```

## Setup

### Prerequisites

- Node.js 18+
- Keycloak server running on port 8080
- Keycloak realm configured with the backend client

### Installation

1. Navigate to the auth service directory:
   ```bash
   cd services/auth
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
   PORT=3005
   KEYCLOAK_SERVER_URL=http://localhost:8080
   KEYCLOAK_REALM=myrealm
   KEYCLOAK_CLIENT_ID=backend
   KEYCLOAK_CLIENT_SECRET=secret
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

## Testing the API

### 1. Test Login
```bash
curl -X POST http://localhost:3005/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

### 2. Test Token Validation
```bash
curl -X GET http://localhost:3005/auth/validate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Test Token Refresh
```bash
curl -X POST http://localhost:3005/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

### 4. Test Logout
```bash
curl -X POST http://localhost:3005/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

### 5. Test Health Check
```bash
curl http://localhost:3005/health
```

## Integration with API Gateway

The authentication service is integrated with the API Gateway at `/api/auth/*`. All authentication endpoints are publicly accessible (no JWT required) since they handle login/logout operations.

### Gateway Routes

- `POST /api/auth/login` → Auth Service `/auth/login`
- `POST /api/auth/refresh` → Auth Service `/auth/refresh`
- `POST /api/auth/logout` → Auth Service `/auth/logout`
- `GET /api/auth/validate` → Auth Service `/auth/validate`
- `GET /api/auth/health` → Auth Service `/auth/health`

## Error Handling

The service provides comprehensive error handling for various scenarios:

### Authentication Errors
- **Invalid Credentials**: Returns 401 with user-friendly message
- **Missing Parameters**: Returns 400 with validation details
- **Server Unavailable**: Returns 503 when Keycloak is down
- **Timeout**: Returns 503 for request timeouts

### Network Errors
- **Connection Refused**: Keycloak server not available
- **DNS Resolution**: Keycloak server hostname issues
- **Timeout**: Request timeout handling

### Validation Errors
- **Empty Credentials**: Username/password validation
- **Invalid Format**: Request body validation
- **Missing Headers**: Authorization header validation

## Security Features

- **Input Sanitization**: All inputs are validated and sanitized
- **SQL Injection Protection**: No direct database queries
- **XSS Protection**: Helmet.js security headers
- **CORS Configuration**: Controlled cross-origin access
- **Request Logging**: All requests are logged with unique IDs
- **Error Masking**: Sensitive error details are not exposed

## Monitoring

### Health Checks

The service provides multiple health check endpoints:

1. **Service Health**: `/health` - Basic service status
2. **Detailed Health**: `/auth/health` - Includes Keycloak connectivity
3. **Gateway Health**: Via API Gateway at `/api/auth/health`

### Logging

- **Request Logging**: All HTTP requests with timestamps
- **Error Logging**: Detailed error information
- **Performance Logging**: Request/response timing
- **Authentication Events**: Login success/failure events

## Architecture

```
Client Request
     ↓
API Gateway (/api/auth/*)
     ↓
Auth Service (Port 3005)
     ↓
Validation Middleware
     ↓
Auth Controller
     ↓
Auth Service Layer
     ↓
Keycloak Client
     ↓
Keycloak Server (Port 8080)
```

## Development

### Project Structure
```
src/
├── controllers/       # HTTP request handlers
├── services/         # Business logic and Keycloak integration
├── middleware/       # Validation and request processing
├── routes/          # Express route definitions
├── types/           # TypeScript interfaces
├── __tests__/       # Unit tests
└── index.ts         # Application entry point
```

### Adding New Features

1. **New Endpoints**: Add routes in `routes/auth.routes.ts`
2. **Validation**: Add validation rules in `middleware/validation.middleware.ts`
3. **Business Logic**: Add methods to `services/auth.service.ts`
4. **Keycloak Integration**: Extend `services/keycloak.service.ts`
5. **Types**: Define interfaces in `types/auth.types.ts`

### Testing Strategy

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test HTTP endpoints with supertest
- **Mocking**: Mock external dependencies (Keycloak, network)
- **Error Scenarios**: Test various error conditions
- **Edge Cases**: Test boundary conditions and invalid inputs

## Troubleshooting

### Common Issues

1. **Keycloak Connection Failed**
   - Check if Keycloak is running on port 8080
   - Verify realm name and client configuration
   - Check network connectivity

2. **Invalid Credentials**
   - Verify username/password in Keycloak admin console
   - Check if user is enabled
   - Verify client secret matches

3. **Token Validation Fails**
   - Check token expiration
   - Verify token signature with Keycloak public keys
   - Ensure correct realm and client configuration

4. **Service Unavailable**
   - Check if auth service is running on port 3005
   - Verify API Gateway configuration
   - Check service health endpoints

### Debugging

Enable detailed logging by setting:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

Check service logs for detailed error information and request tracing.