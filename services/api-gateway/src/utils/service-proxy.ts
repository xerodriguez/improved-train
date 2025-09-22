import axios, { AxiosResponse, AxiosError } from 'axios';
import { Request, Response } from 'express';

export interface ServiceConfig {
    name: string;
    baseUrl: string;
    timeout?: number;
    retries?: number;
}

export interface ServiceStatus {
    service: string;
    status: string;
    url?: string;
}

export class ServiceProxy {
    private services: Map<string, ServiceConfig>;

    constructor() {
        this.services = new Map();
        this.initializeServices();
    }

    private initializeServices(): void {
        // Configure all microservices
        this.services.set('products', {
            name: 'products',
            baseUrl: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3002',
            timeout: 5000,
            retries: 3
        });

        this.services.set('suppliers', {
            name: 'suppliers',
            baseUrl: process.env.SUPPLIERS_SERVICE_URL || 'http://localhost:3003',
            timeout: 5000,
            retries: 3
        });

        this.services.set('users', {
            name: 'users',
            baseUrl: process.env.USERS_SERVICE_URL || 'http://localhost:3004',
            timeout: 5000,
            retries: 3
        });
    }

    public async forwardRequest(
        serviceName: string,
        req: Request,
        res: Response,
        path?: string
    ): Promise<void> {
        const service = this.services.get(serviceName);

        if (!service) {
            res.status(404).json({
                success: false,
                error: `Service '${serviceName}' not found`
            });
            return;
        }

        const targetPath = path || req.path;
        const targetUrl = `${service.baseUrl}${targetPath}`;

        console.log(`Forwarding ${req.method} request to: ${targetUrl}`);

        try {
            const response: AxiosResponse = await axios({
                method: req.method as any,
                url: targetUrl,
                data: req.body,
                params: req.query,
                headers: this.sanitizeHeaders(req.headers),
                timeout: service.timeout,
                validateStatus: () => true, // Accept all status codes
            });

            // Forward the response
            res.status(response.status)
                .set(this.sanitizeResponseHeaders(response.headers))
                .json(response.data);

        } catch (error) {
            this.handleProxyError(error as AxiosError, serviceName, res);
        }
    }

    private sanitizeHeaders(headers: any): any {
        const sanitized = { ...headers };

        // Remove headers that shouldn't be forwarded
        delete sanitized.host;
        delete sanitized.connection;
        delete sanitized['content-length'];
        delete sanitized['transfer-encoding'];

        return sanitized;
    }

    private sanitizeResponseHeaders(headers: any): any {
        const sanitized = { ...headers };

        // Remove headers that shouldn't be forwarded back
        delete sanitized['transfer-encoding'];
        delete sanitized.connection;

        return sanitized;
    }

    private handleProxyError(error: AxiosError, serviceName: string, res: Response): void {
        console.error(`Error forwarding request to ${serviceName}:`, error.message);

        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            // Service unreachable
            res.status(502).json({
                success: false,
                error: `Service '${serviceName}' is currently unavailable`,
                code: 'SERVICE_UNAVAILABLE'
            });
        } else if (error.response) {
            // Service returned an error response
            res.status(error.response.status).json(error.response.data);
        } else {
            // Other network or configuration error
            res.status(500).json({
                success: false,
                error: 'Internal gateway error',
                code: 'GATEWAY_ERROR'
            });
        }
    }

    public async healthCheck(serviceName: string): Promise<boolean> {
        const service = this.services.get(serviceName);

        if (!service) {
            return false;
        }

        try {
            const response = await axios.get(`${service.baseUrl}/health`, {
                timeout: 3000
            });
            return response.status === 200;
        } catch (error) {
            console.error(`Health check failed for ${serviceName}:`, error);
            return false;
        }
    }

    public getServiceStatus(): Promise<ServiceStatus[]> {
        const statusPromises = Array.from(this.services.keys()).map(async (serviceName) => {
            const isHealthy = await this.healthCheck(serviceName);
            return {
                service: serviceName,
                status: isHealthy ? 'healthy' : 'unhealthy',
                url: this.services.get(serviceName)?.baseUrl
            };
        });

        return Promise.all(statusPromises);
    }
}

export default new ServiceProxy();