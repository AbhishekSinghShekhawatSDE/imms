const { pool } = require('./connection');
const bcrypt = require('bcrypt');

const machines = [
    { name: 'CNC Mill Line 1', location: 'Zone A', type: 'cnc' },
    { name: 'CNC Mill Line 2', location: 'Zone A', type: 'cnc' },
    { name: 'Hydraulic Press A', location: 'Zone B', type: 'press' },
    { name: 'Conveyor Belt 1', location: 'Zone C', type: 'conveyor' },
    { name: 'Air Compressor Unit 3', location: 'Zone B', type: 'compressor' },
    { name: 'Cooling Tower Pump', location: 'Zone D', type: 'pump' }
];

const thresholdConfigs = {
    temperature: { warning: 75, critical: 90, trend_rate: 1.5 },
    vibration: { warning: 4.5, critical: 8.0, trend_rate: 0.3 },
    energy: { warning: 70, critical: 85, trend_rate: 2.0 }
};

async function seed() {
    console.log('--- [IMMS v1.0] Seeding Initial Data ---');

    try {
        const hash = await bcrypt.hash('imms2026', 10);
        await pool.query(
            `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)
             ON CONFLICT (email) DO NOTHING`,
            ['engineer@imms.demo', hash, 'Demo Engineer']
        );
        console.log('✅ Demo user seeded.');

        for (const m of machines) {
            // Insert machine
            const mRes = await pool.query(
                `INSERT INTO machines (name, location, type, status) 
         VALUES ($1, $2, $3, 'active') 
         ON CONFLICT (id) DO NOTHING 
         RETURNING id`,
                [m.name, m.location, m.type]
            );

            const machineId = mRes.rows[0]?.id;

            if (machineId) {
                console.log(`Seeded machine: ${m.name} (${machineId})`);

                // Seed thresholds for each defined metric
                for (const [metric, vals] of Object.entries(thresholdConfigs)) {
                    await pool.query(
                        `INSERT INTO alert_thresholds (machine_id, metric, warning_value, critical_value, trend_rate_threshold)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (machine_id, metric) DO NOTHING`,
                        [machineId, metric, vals.warning, vals.critical, vals.trend_rate]
                    );
                }
            }
        }

        console.log('✅ Seeding completed.');
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
