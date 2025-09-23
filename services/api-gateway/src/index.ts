import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';
import serviceProxy from './utils/service-proxy';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Accept-Version',
        'Content-Length',
        'Content-MD5',
        'Date',
        'X-Api-Version',
        'X-Request-ID',
        'X-CSRF-Token'
    ],
    exposedHeaders: [
        'X-Request-ID',
        'X-Response-Time',
        'X-Rate-Limit-Limit',
        'X-Rate-Limit-Remaining',
        'X-Rate-Limit-Reset'
    ],
    credentials: false, // Set to false when origin is '*'
    maxAge: 86400, // 24 hours preflight cache
    preflightContinue: false,
    optionsSuccessStatus: 200
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS,HEAD');
    res.header('Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, X-API-Key, X-Request-ID'
    );
    res.header('Access-Control-Expose-Headers',
        'X-Request-ID, X-Response-Time, X-Rate-Limit-Limit, X-Rate-Limit-Remaining'
    );
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        return res.status(200).end();
    }

    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// CORS test endpoint
app.get('/cors-test', (req, res) => {
    res.json({
        message: 'CORS is working correctly!',
        origin: req.headers.origin || 'No origin header',
        userAgent: req.headers['user-agent'] || 'No user agent',
        method: req.method,
        headers: {
            'access-control-allow-origin': res.getHeader('Access-Control-Allow-Origin'),
            'access-control-allow-methods': res.getHeader('Access-Control-Allow-Methods'),
            'access-control-allow-headers': res.getHeader('Access-Control-Allow-Headers'),
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
    });
});

// Keycloak connection test endpoint
app.get('/auth-test', async (req, res) => {
    try {
        const keycloakUrl = process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080';
        const realm = process.env.KEYCLOAK_REALM || 'myrealm';

        // Test Keycloak well-known endpoint
        const wellKnownUrl = `${keycloakUrl}/realms/${realm}/.well-known/openid_configuration`;
        const jwksUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;

        const tests = {
            keycloak_reachable: false,
            jwks_reachable: false,
            realm_exists: false,
            config: null,
            keys: null
        };

        try {
            const configResponse = await fetch(wellKnownUrl);
            if (configResponse.ok) {
                tests.keycloak_reachable = true;
                tests.realm_exists = true;
                tests.config = await configResponse.json();
            }
        } catch (error) {
            console.log('Keycloak config test failed:', error);
        }

        try {
            const jwksResponse = await fetch(jwksUrl);
            if (jwksResponse.ok) {
                tests.jwks_reachable = true;
                tests.keys = await jwksResponse.json();
            }
        } catch (error) {
            console.log('JWKS test failed:', error);
        }

        res.json({
            message: 'Authentication service test results',
            keycloak: {
                url: keycloakUrl,
                realm: realm,
                wellKnownUrl: wellKnownUrl,
                jwksUrl: jwksUrl
            },
            tests: tests,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Auth test failed',
            message: error instanceof Error ? error.message : 'Unknown error',
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
            auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3005',
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