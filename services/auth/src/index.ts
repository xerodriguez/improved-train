import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Request parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request ID middleware for tracing
app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] ||
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.headers['x-request-id']}`);
    next();
});

// Main health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        keycloak: {
            server: process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080',
            realm: process.env.KEYCLOAK_REALM || 'myrealm'
        }
    });
});

// Service information endpoint
app.get('/info', (req, res) => {
    res.json({
        name: 'Authentication Service',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: {
            login: 'POST /auth/login',
            refresh: 'POST /auth/refresh',
            logout: 'POST /auth/logout',
            validate: 'GET /auth/validate',
            health: 'GET /auth/health'
        },
        keycloak: {
            server: process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080',
            realm: process.env.KEYCLOAK_REALM || 'myrealm',
            clientId: process.env.KEYCLOAK_CLIENT_ID || 'backend'
        }
    });
});

// Auth routes
app.use('/auth', authRoutes);

// Root redirect
app.get('/', (req, res) => {
    res.redirect('/info');
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
    console.warn(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
    });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
    });

    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        requestId: req.headers['x-request-id'],
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start the server
app.listen(PORT, () => {
    console.log(`🔐 Authentication Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`ℹ️  Service info: http://localhost:${PORT}/info`);
    console.log(`🔑 Login endpoint: http://localhost:${PORT}/auth/login`);
    console.log(`🔄 Token refresh: http://localhost:${PORT}/auth/refresh`);
    console.log(`🚪 Logout endpoint: http://localhost:${PORT}/auth/logout`);
    console.log(`✅ Token validation: http://localhost:${PORT}/auth/validate`);
    console.log(`🔗 Keycloak: ${process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080'}`);
});

export default app;