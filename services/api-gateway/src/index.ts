import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';
import serviceProxy from './utils/service-proxy';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
    stream: {
        write: (message: string) => {
            console.log(`[${new Date().toISOString()}] ${message.trim()}`);
        }
    }
}));

// Request ID middleware for tracing
app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] ||
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const serviceStatuses = await serviceProxy.getServiceStatus();
        const allHealthy = serviceStatuses.every(service => service.status === 'healthy');

        res.status(allHealthy ? 200 : 503).json({
            status: allHealthy ? 'healthy' : 'degraded',
            gateway: 'healthy',
            services: serviceStatuses,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0'
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: 'Failed to check service health',
            timestamp: new Date().toISOString()
        });
    }
});

// Gateway information endpoint
app.get('/info', (req, res) => {
    res.json({
        name: 'API Gateway',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        services: {
            products: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3002',
            suppliers: process.env.SUPPLIERS_SERVICE_URL || 'http://localhost:3003',
            users: process.env.USERS_SERVICE_URL || 'http://localhost:3004'
        }
    });
});

// API routes with /api prefix
app.use('/api', apiRoutes);

// 404 handler for unknown routes
app.use('*', (req, res) => {
    console.warn(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    res.status(500).json({
        success: false,
        error: 'Internal gateway error',
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
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`ℹ️  Gateway info: http://localhost:${PORT}/info`);
    console.log(`🔗 API endpoints: http://localhost:${PORT}/api/*`);
    console.log(`🔐 Authentication: Keycloak JWT tokens required`);
});

export default app;