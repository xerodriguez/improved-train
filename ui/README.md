# Northwind Products UI

A modern React application for managing Northwind products with authentication via Keycloak.

## Features

- **User Authentication**: Secure login/logout using Keycloak integration
- **Products Management**: View and manage product inventory with real-time data
- **Modern UI**: Built with Material-UI components and responsive design
- **TypeScript**: Full type safety and better development experience
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Token Management**: Automatic token refresh and secure storage

## Technology Stack

- **Frontend**: React 18, TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **Data Grid**: MUI X Data Grid
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Authentication**: JWT tokens via Keycloak

## Prerequisites

Before running the application, ensure you have:

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Backend Services** running:
   - API Gateway (port 3000)
   - Authentication Service (port 3005)
   - Products Service (port 3002)
   - Keycloak Server (port 8080)

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and update values if needed:
   ```bash
   cp .env.example .env
   ```

   Default configuration:
   ```
   REACT_APP_API_URL=http://localhost:3000
   REACT_APP_AUTH_SERVICE_URL=http://localhost:3005
   ```

## Running the Application

1. **Development mode**:
   ```bash
   npm start
   ```
   Opens the app at [http://localhost:3001](http://localhost:3001)

2. **Production build**:
   ```bash
   npm run build
   npm install -g serve
   serve -s build
   ```

## Application Structure

```
src/
├── components/          # React components
│   ├── Login.tsx       # Login form component
│   └── Products.tsx    # Products table component
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── routes/             # Routing configuration
│   └── AppRoutes.tsx   # Main routes component
├── services/           # API services
│   ├── authService.ts  # Authentication API calls
│   └── productsService.ts # Products API calls
├── types/              # TypeScript type definitions
│   └── index.ts        # Application types
├── App.tsx             # Main app component
└── index.tsx           # Application entry point
```

## Usage

### Login

1. Navigate to the application
2. Enter your Keycloak credentials:
   - Username: Your Keycloak username
   - Password: Your Keycloak password
3. Click "Sign In"

### Products Management

After successful login, you'll see:

- **Products Table**: Complete list of products with all database fields
- **Search & Filter**: Built-in data grid search and filtering
- **Status Indicators**: Visual indicators for stock levels and product status
- **Real-time Data**: Fresh data from the Northwind database
- **Responsive Design**: Works on desktop and mobile devices

### Navigation

- **Header**: Shows current user and logout option
- **Refresh**: Manual refresh button to update product data
- **Auto-redirect**: Automatic navigation based on authentication status

## API Integration

The application integrates with multiple backend services:

### Authentication Service (Port 3005)
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh
- `GET /auth/validate` - Token validation

### API Gateway (Port 3000)
- `GET /products` - Get all products (requires JWT token)

## Error Handling

The application includes comprehensive error handling:

- **Network Errors**: Connection issues with backend services
- **Authentication Errors**: Invalid credentials, expired tokens
- **Authorization Errors**: Insufficient permissions
- **Server Errors**: Backend service unavailability
- **Validation Errors**: Form validation and data validation

## Security Features

- **JWT Token Storage**: Secure local storage with automatic cleanup
- **Token Refresh**: Automatic token renewal before expiration
- **Route Protection**: Protected routes require authentication
- **Error Boundaries**: Graceful handling of unexpected errors
- **Input Validation**: Client-side validation for forms

## Development

### Code Structure

- **Components**: Functional components with hooks
- **TypeScript**: Full type safety for better development experience
- **Material-UI**: Consistent design system and components
- **Context API**: Global state management for authentication
- **Service Layer**: Separated API logic for better maintainability

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **API Services**: Add to `src/services/`
3. **Types**: Update `src/types/index.ts`
4. **Routes**: Update `src/routes/AppRoutes.tsx`

### Environment Variables

- `REACT_APP_API_URL`: API Gateway base URL
- `REACT_APP_AUTH_SERVICE_URL`: Authentication service URL

## Troubleshooting

### Common Issues

1. **Login fails**:
   - Check Keycloak server is running
   - Verify credentials in Keycloak admin console
   - Check authentication service logs

2. **Products don't load**:
   - Verify API Gateway is running
   - Check Products service is running
   - Ensure database connection is working

3. **Token errors**:
   - Clear browser local storage
   - Check token expiration settings in Keycloak

### Debug Mode

Enable debug mode by opening browser console to see detailed error logs.

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Serve static files**:
   ```bash
   serve -s build -l 3001
   ```

3. **Environment Configuration**:
   Update `.env` with production URLs before building.

## License

This project is part of the Northwind Products Management System.