const { Pool } = require('pg');
const Redis = require('ioredis');
require('dotenv').config();

// PostgreSQL Connection Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://imms_user:imms_pass@localhost:5432/imms_db',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Redis Client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        return Math.min(times * 100, 3000);
    }
});

pool.on('connect', () => {
    console.log('--- PostgreSQL Connection Initialized ---');
});

pool.on('error', (err) => {
    console.error('--- Critical PostgreSQL Connection Error ---', err);
});

redis.on('connect', () => {
    console.log('--- Redis Connection Initialized ---');
});

redis.on('error', (err) => {
    console.warn('--- Redis connection issue (Normal if docker is not running):', err.message);
});

module.exports = { pool, redis };
