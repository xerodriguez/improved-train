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
        this.keycloakServerUrl = process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080/auth';
        this.realm = process.env.KEYCLOAK_REALM || 'myrealm';

        console.log('Initializing AuthenticationMiddleware with:', {
            keycloakServerUrl: this.keycloakServerUrl,
            realm: this.realm,
            jwksUri: `${this.keycloakServerUrl}/realms/${this.realm}/protocol/openid-connect/certs`
        });

        this.jwksClient = jwksClient({
            jwksUri: `${this.keycloakServerUrl}/realms/${this.realm}/protocol/openid-connect/certs`,
            cache: true,
            cacheMaxEntries: 5,
            cacheMaxAge: 600000, // 10 minutes
            requestHeaders: {
                'User-Agent': 'API-Gateway-JWKS-Client/1.0.0'
            },
            timeout: 30000, // 30 seconds timeout
            jwksRequestsPerMinute: 10
        });

        // Test connection on startup
        this.testKeycloakConnection();
        this.testJWKSEndpoint();
    }

    private async testKeycloakConnection(): Promise<void> {
        try {
            const testUrl = `${this.keycloakServerUrl}/realms/${this.realm}/.well-known/openid_configuration`;
            console.log(`Testing Keycloak connection: ${testUrl}`);

            // Simple fetch test to verify Keycloak is reachable
            const response = await fetch(testUrl);
            if (response.ok) {
                const config = await response.json();
                console.log('✅ Keycloak connection successful');
                console.log('JWKS URI from well-known:', config.jwks_uri);
            } else {
                console.warn('⚠️ Keycloak connection test failed:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ Keycloak connection test error:', error);
            console.log('🔧 Please verify:');
            console.log('   - Keycloak is running at:', this.keycloakServerUrl);
            console.log('   - Realm exists:', this.realm);
            console.log('   - Network connectivity is available');
        }
    }

    private getKey = (header: any, callback: any) => {
        console.log(`Attempting to get signing key for kid: ${header.kid}`);
        console.log(`JWKS URI: ${this.keycloakServerUrl}/realms/${this.realm}/protocol/openid-connect/certs`);

        this.jwksClient.getSigningKey(header.kid, (err, key) => {
            if (err) {
                console.error('Error getting signing key:', {
                    error: err.message,
                    kid: header.kid,
                    jwksUri: `${this.keycloakServerUrl}/realms/${this.realm}/protocol/openid-connect/certs`,
                    keycloakUrl: this.keycloakServerUrl,
                    realm: this.realm
                });
                return callback(err);
            }

            if (!key) {
                console.error('No key returned from JWKS client');
                return callback(new Error('No signing key found'));
            }

            try {
                const signingKey = key.getPublicKey();
                console.log('Successfully retrieved signing key');
                callback(null, signingKey);
            } catch (keyError) {
                console.error('Error extracting public key:', keyError);
                callback(keyError);
            }
        });
    };

    public authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                res.status(401).json({
                    success: false,
                    error: 'No authorization header provided',
                    hint: 'Include Authorization: Bearer <token> header'
                });
                return;
            }

            const token = authHeader.split(' ')[1]; // Remove 'Bearer ' prefix

            if (!token) {
                res.status(401).json({
                    success: false,
                    error: 'No token provided',
                    hint: 'Authorization header format: Bearer <token>'
                });
                return;
            }

            console.log('Attempting to verify JWT token...');

            // Verify JWT token
            jwt.verify(token, this.getKey, {
                audience: process.env.KEYCLOAK_CLIENT_ID || 'account',
                issuer: `${this.keycloakServerUrl}/realms/${this.realm}`,
                algorithms: ['RS256']
            }, (err, decoded) => {
                if (err) {
                    console.error('JWT verification error:', {
                        error: err.message,
                        name: err.name,
                        keycloakUrl: this.keycloakServerUrl,
                        realm: this.realm,
                        audience: process.env.KEYCLOAK_CLIENT_ID || 'account',
                        issuer: `${this.keycloakServerUrl}/realms/${this.realm}`
                    });

                    let errorMessage = 'Invalid or expired token';
                    let hint = 'Please login again to get a new token';

                    if (err.message.includes('Not Found')) {
                        errorMessage = 'Keycloak server or realm not found';
                        hint = 'Please check Keycloak server configuration';
                    } else if (err.message.includes('audience')) {
                        errorMessage = 'Token audience mismatch';
                        hint = 'Token was issued for a different client';
                    } else if (err.message.includes('issuer')) {
                        errorMessage = 'Token issuer mismatch';
                        hint = 'Token was issued by a different server';
                    }

                    res.status(401).json({
                        success: false,
                        error: errorMessage,
                        hint: hint,
                        debug: process.env.NODE_ENV === 'development' ? {
                            keycloakUrl: this.keycloakServerUrl,
                            realm: this.realm,
                            expectedIssuer: `${this.keycloakServerUrl}/realms/${this.realm}`,
                            expectedAudience: process.env.KEYCLOAK_CLIENT_ID || 'account'
                        } : undefined
                    });
                    return;
                }

                console.log('JWT token verified successfully');
                // Add user information to request
                req.user = decoded;
                next();
            });

        } catch (error) {
            console.error('Authentication middleware error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal authentication error',
                hint: 'Please try again or contact support'
            });
        }
    };

    public async testJWKSEndpoint(): Promise<void> {
        try {
            console.log('🔍 Testing JWKS endpoint...');
            const jwksUri = `${this.keycloakServerUrl}/realms/${this.realm}/protocol/openid-connect/certs`;

            const response = await fetch(jwksUri);
            if (response.ok) {
                const jwks = await response.json();
                console.log('✅ JWKS endpoint accessible');
                console.log('Available keys:', jwks.keys?.length || 0);
                if (jwks.keys && jwks.keys.length > 0) {
                    console.log('Key IDs (kids):', jwks.keys.map((key: any) => key.kid));
                }
            } else {
                console.error('❌ JWKS endpoint not accessible:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ Error testing JWKS endpoint:', error);
        }
    }

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
