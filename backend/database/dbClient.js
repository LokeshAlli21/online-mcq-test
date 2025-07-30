// dbClient.js
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class DatabaseClient {
    constructor() {
        this.pool = null;
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 2000;
    }

    /**
     * Initialize database connection pool
     */
    async connect() {
        try {
            const config = {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 5432,
                database: process.env.DB_NAME || 'myapp',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'password',
                
                // Connection pool settings
                max: parseInt(process.env.DB_POOL_MAX) || 20,
                min: parseInt(process.env.DB_POOL_MIN) || 2,
                idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
                connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
                
                // SSL configuration for production
                ssl: process.env.NODE_ENV === 'production' ? {
                    rejectUnauthorized: false
                } : false,

                // Additional options
                application_name: process.env.APP_NAME || 'MyApp',
                query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
            };

            this.pool = new Pool(config);

            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            this.isConnected = true;
            this.retryCount = 0;

            console.log('✅ Database connected successfully');
            // console.log(`📊 Pool: min=${config.min}, max=${config.max}`);

            // Handle pool events
            this.setupPoolEvents();

            return this.pool;
        } catch (error) {
            await this.handleConnectionError(error);
        }
    }

    /**
     * Setup pool event handlers
     */
    setupPoolEvents() {
        this.pool.on('connect', (client) => {
            console.log('🔗 New client connected to database');
        });

        this.pool.on('error', (err) => {
            console.error('💥 Database pool error:', err);
            this.isConnected = false;
        });

        this.pool.on('remove', () => {
            console.log('📤 Client removed from pool');
        });
    }

    /**
     * Handle connection errors with retry logic
     */
    async handleConnectionError(error) {
        console.error(`❌ Database connection failed (attempt ${this.retryCount + 1}/${this.maxRetries}):`, error.message);

        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`🔄 Retrying connection in ${this.retryDelay / 1000}s...`);
            
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            return this.connect();
        } else {
            throw new Error(`Failed to connect to database after ${this.maxRetries} attempts: ${error.message}`);
        }
    }

    /**
     * Execute a query with parameters
     */
    async query(text, params = []) {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.');
        }

        const start = Date.now();
        
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            // Log slow queries (>1s)
            if (duration > 1000) {
                console.warn(`🐌 Slow query detected (${duration}ms):`, text.substring(0, 100));
            }

            return result;
        } catch (error) {
            console.error('💥 Query error:', {
                query: text.substring(0, 100),
                params: params,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Execute a transaction
     */
    async transaction(callback) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('💥 Transaction error:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get a single row
     */
    async queryOne(text, params = []) {
        const result = await this.query(text, params);
        return result.rows[0] || null;
    }

    /**
     * Get multiple rows
     */
    async queryMany(text, params = []) {
        const result = await this.query(text, params);
        return result.rows;
    }

    /**
     * Check if database is healthy
     */
    async healthCheck() {
        try {
            const result = await this.query('SELECT version(), NOW() as current_time');
            return {
                status: 'healthy',
                version: result.rows[0].version,
                currentTime: result.rows[0].current_time,
                poolStats: {
                    totalCount: this.pool.totalCount,
                    idleCount: this.pool.idleCount,
                    waitingCount: this.pool.waitingCount
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Close all connections
     */
    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
            console.log('📤 Database connections closed');
        }
    }

    /**
     * Get pool statistics
     */
    getPoolStats() {
        if (!this.pool) return null;

        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount,
            maxConnections: this.pool.options.max,
            minConnections: this.pool.options.min
        };
    }
}

// Create singleton instance
const dbClient = new DatabaseClient();

// Utility functions for common operations
export const db = {
    // Connection management
    connect: () => dbClient.connect(),
    disconnect: () => dbClient.disconnect(),
    healthCheck: () => dbClient.healthCheck(),
    getStats: () => dbClient.getPoolStats(),

    // Query methods
    query: (text, params) => dbClient.query(text, params),
    queryOne: (text, params) => dbClient.queryOne(text, params),
    queryMany: (text, params) => dbClient.queryMany(text, params),
    transaction: (callback) => dbClient.transaction(callback),

    // Common CRUD operations
    async findById(table, id, idColumn = 'id') {
        return dbClient.queryOne(
            `SELECT * FROM ${table} WHERE ${idColumn} = $1`,
            [id]
        );
    },

    async findMany(table, conditions = {}, limit = null, offset = 0) {
        const keys = Object.keys(conditions);
        const values = Object.values(conditions);
        
        let whereClause = '';
        if (keys.length > 0) {
            whereClause = 'WHERE ' + keys.map((key, index) => 
                `${key} = $${index + 1}`
            ).join(' AND ');
        }

        let limitClause = '';
        if (limit) {
            limitClause = `LIMIT ${limit} OFFSET ${offset}`;
        }

        const query = `SELECT * FROM ${table} ${whereClause} ${limitClause}`.trim();
        return dbClient.queryMany(query, values);
    },

    async create(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
        
        const query = `
            INSERT INTO ${table} (${keys.join(', ')}) 
            VALUES (${placeholders}) 
            RETURNING *
        `;
        
        return dbClient.queryOne(query, values);
    },

    async update(table, id, data, idColumn = 'id') {
        const keys = Object.keys(data);
        const values = Object.values(data);
        
        const setClause = keys.map((key, index) => 
            `${key} = $${index + 1}`
        ).join(', ');
        
        const query = `
            UPDATE ${table} 
            SET ${setClause} 
            WHERE ${idColumn} = $${keys.length + 1} 
            RETURNING *
        `;
        
        return dbClient.queryOne(query, [...values, id]);
    },

    async delete(table, id, idColumn = 'id') {
        const query = `DELETE FROM ${table} WHERE ${idColumn} = $1 RETURNING *`;
        return dbClient.queryOne(query, [id]);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, closing database connections...');
    await dbClient.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, closing database connections...');
    await dbClient.disconnect();
    process.exit(0);
});

export default db;