import { Pool, PoolConfig } from 'pg';

export class DatabaseConnection {
    private static instance: DatabaseConnection;
    private pool: Pool;

    private constructor() {
        const config: PoolConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'northwind',
            max: 20, // Maximum number of clients in the pool
            idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
            connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
        };

        this.pool = new Pool(config);

        // Handle pool errors
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            process.exit(-1);
        });

        // Test the connection
        this.testConnection();
    }

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    private async testConnection(): Promise<void> {
        try {
            const client = await this.pool.connect();
            console.log('Connected to PostgreSQL database');
            client.release();
        } catch (err) {
            console.error('Error connecting to PostgreSQL:', err);
            throw err;
        }
    }

    public getPool(): Pool {
        return this.pool;
    }

    public async query(text: string, params?: any[]): Promise<any> {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            console.log('Executed query', { text, duration, rows: res.rowCount });
            return res;
        } catch (err) {
            console.error('Database query error:', err);
            throw err;
        }
    }

    public async close(): Promise<void> {
        await this.pool.end();
        console.log('Database pool closed');
    }
}

export default DatabaseConnection.getInstance();