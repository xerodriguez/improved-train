import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export interface AuthenticatedRequest extends Request {
    user?: any;
}

export class AuthenticationMiddleware {
    private jwksClient: jwksClient.JwksClient;
    private keycloakServerUrl: string;
    private realm: string;

    constructor() {
        this.keycloakServerUrl = process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080';
        this.realm = process.env.KEYCLOAK_REALM || 'myrealm';

        this.jwksClient = jwksClient({
            jwksUri: `${this.keycloakServerUrl}/realms/${this.realm}/protocol/openid-connect/certs`,
            cache: true,
            cacheMaxEntries: 5,
            cacheMaxAge: 600000, // 10 minutes
        });
    }

    private getKey = (header: any, callback: any) => {
        this.jwksClient.getSigningKey(header.kid, (err, key) => {
            if (err) {
                console.error('Error getting signing key:', err);
                return callback(err);
            }
            const signingKey = key?.getPublicKey();
            callback(null, signingKey);
        });
    };

    public authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                res.status(401).json({
                    success: false,
                    error: 'No authorization header provided'
                });
                return;
            }

            const token = authHeader.split(' ')[1]; // Remove 'Bearer ' prefix

            if (!token) {
                res.status(401).json({
                    success: false,
                    error: 'No token provided'
                });
                return;
            }

            // Verify JWT token
            jwt.verify(token, this.getKey, {
                audience: process.env.KEYCLOAK_CLIENT_ID || 'account',
                issuer: `${this.keycloakServerUrl}/realms/${this.realm}`,
                algorithms: ['RS256']
            }, (err, decoded) => {
                if (err) {
                    console.error('JWT verification error:', err);
                    res.status(401).json({
                        success: false,
                        error: 'Invalid or expired token'
                    });
                    return;
                }

                // Add user information to request
                req.user = decoded;
                next();
            });

        } catch (error) {
            console.error('Authentication middleware error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal authentication error'
            });
        }
    };

    public authorize = (roles: string[]) => {
        return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const userRoles = req.user.realm_access?.roles || [];
            const hasRequiredRole = roles.some(role => userRoles.includes(role));

            if (!hasRequiredRole) {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions'
                });
                return;
            }

            next();
        };
    };
}

export default new AuthenticationMiddleware();