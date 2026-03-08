const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function migrate() {
    const migrationPath = path.join(__dirname, 'migrations', '001_initial.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('--- [IMMS v1.0] Running Database Migrations ---');

    try {
        // Ensure gen_random_uuid extension
        await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

        // Split by semicolons for multi-statement execution if needed, 
        // but pool.query usually handles it if they aren't complex DO blocks.
        // For simplicity, we execute the whole block.
        await pool.query(sql);

        console.log('✅ Migrations completed successfully.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
