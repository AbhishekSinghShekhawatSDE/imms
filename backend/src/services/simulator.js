const { pool, redis } = require('../db/connection');

/**
 * Generator function to create realistic sensor data
 */
function generateReading(machine, ticks) {
    const variation = (range) => (Math.random() - 0.5) * 2 * range;

    let temp = machine.baseTemp;
    let vibration = machine.baseVib;
    let energy = machine.baseEnergy;

    // --- ANOMALY INJECTION LOGIC ---

    // 1. CNC Mill Line 1: temperature spikes to 93C for 2 min, every 45 min
    if (machine.id_slug === 'cnc-mill-1') {
        const cycle = ticks % 1350;
        if (cycle >= 0 && cycle < 60) {
            temp = 93;
        }
    }

    // 2. Hydraulic Press A: vibration rises to 9 mm/s over 10 min, every 2 hours
    if (machine.id_slug === 'hyd-press-a') {
        const cycle = ticks % 3600;
        if (cycle >= 0 && cycle < 300) {
            vibration = machine.baseVib + (cycle / 300) * 6.5;
        }
    }

    // 3. Cooling Tower Pump: temperature trends +2.3C per minute for 12 min, every hour
    if (machine.id_slug === 'pump-d') {
        const cycle = ticks % 1800;
        if (cycle >= 0 && cycle < 360) {
            temp = machine.baseTemp + (cycle * 0.0766);
        }
    }

    return {
        temperature: parseFloat((temp + variation(2)).toFixed(1)),
        vibration: parseFloat((vibration + variation(0.3)).toFixed(2)),
        energy: parseFloat((energy + variation(5)).toFixed(1)),
        rpm: 1450 + variation(20)
    };
}

/**
 * Main simulation loop
 */
async function startSimulator(io) {
    console.log('--- [IMMS v1.0] Fetching machine fleet for simulation ---');

    try {
        const mRes = await pool.query('SELECT id, name FROM machines');
        const dbMachines = mRes.rows;

        if (dbMachines.length === 0) {
            console.warn('⚠️ No machines found in DB. Run npm run seed first.');
            return;
        }

        const machineConfigs = dbMachines.map(m => ({
            ...m,
            id_slug: m.name.toLowerCase().replace(/ /g, '-').includes('pump') ? 'pump-d' : (m.name.includes('CNC Mill Line 1') ? 'cnc-mill-1' : (m.name.includes('Hydraulic Press A') ? 'hyd-press-a' : 'other')),
            baseTemp: 65,
            baseVib: 2.5,
            baseEnergy: 45
        }));

        // Adjust specific bases
        machineConfigs.forEach(mc => {
            if (mc.name.includes('Press')) mc.baseEnergy = 85;
            if (mc.name.includes('Conveyor')) mc.baseTemp = 72;
        });

        console.log(`--- [IMMS v1.0] Monitoring ${machineConfigs.length} Live Machines ---`);

        let globalTicks = 0;

        setInterval(async () => {
            globalTicks++;

            for (const machine of machineConfigs) {
                const reading = generateReading(machine, globalTicks);
                const timestamp = new Date();

                // 1. Write to TimescaleDB (Async query, non-blocking)
                pool.query(
                    `INSERT INTO sensor_readings (time, machine_id, temperature, vibration, energy, rpm)
           VALUES ($1, $2, $3, $4, $5, $6)`,
                    [timestamp, machine.id, reading.temperature, reading.vibration, reading.energy, reading.rpm]
                ).catch(e => console.error(`DB Write Error (${machine.name}):`, e.message));

                // 2. Cache latest in Redis (30 second TTL)
                const cachePayload = { ...reading, machine_id: machine.id, time: timestamp };
                redis.set(`machine:${machine.id}:latest`, JSON.stringify(cachePayload), 'EX', 30)
                    .catch(e => { });

                // 3. Emit to frontend
                if (io) {
                    io.emit('sensor:reading', cachePayload);
                }

                // 4. Publish to internal alert engine channel
                redis.publish('sensor_updates', JSON.stringify(cachePayload));
            }
        }, 2000);

    } catch (err) {
        console.error('❌ Simulator startup failed:', err.message);
    }
}

module.exports = { startSimulator };
