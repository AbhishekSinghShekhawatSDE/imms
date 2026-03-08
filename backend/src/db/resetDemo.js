const { pool, redis } = require('./connection');

async function resetDemo() {
    console.log('--- [IMMS v1.0] RESETTING DEMO ENVIRONMENT ---');

    try {
        // 1. Clear Alerts
        await pool.query('DELETE FROM alerts');
        console.log('✅ Alerts cleared');

        // 2. Clear Sensor Readings (Optional, but keeps charts clean for demo)
        await pool.query('DELETE FROM sensor_readings');
        console.log('✅ Historical readings cleared');

        // 3. Reset machine status
        await pool.query("UPDATE machines SET status = 'active'");
        console.log('✅ Machine statuses reset to active');

        // 4. Flush Redis cache
        await redis.flushdb();
        console.log('✅ Redis cache flushed');

        console.log('--- [READY] Demo environment is clean ---');
    } catch (err) {
        console.error('❌ Reset failed:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

resetDemo();
