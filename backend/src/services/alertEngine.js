const { pool, redis } = require('../db/connection');
const { sendAlertNotification } = require('./notificationService');
const Redis = require('ioredis');

// Local sub client for alert engine
const subClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
subClient.on('error', (err) => console.warn('--- Alert Engine Redis subscriber issue:', err.message));

/**
 * Start Alert Engine logic
 * Subscribes to live sensor updates and runs rules
 */
async function startAlertEngine(io) {
    console.log('--- [IMMS v1.0] Alert Engine Initialized ---');

    subClient.subscribe('sensor_updates');

    subClient.on('message', async (channel, message) => {
        if (channel === 'sensor_updates') {
            const reading = JSON.parse(message);
            await runRules(reading, io);
        }
    });
}

async function runRules(reading, io) {
    const { machine_id, temperature, vibration, energy, time } = reading;

    // 1. Fetch Thresholds (Could be cached in memory for extreme performance)
    const tRes = await pool.query(
        'SELECT * FROM alert_thresholds WHERE machine_id = $1',
        [machine_id]
    );

    const thresholds = tRes.rows.reduce((acc, row) => ({ ...acc, [row.metric]: row }), {});

    // 2. CHECK 1: STATIC THRESHOLD
    if (thresholds.temperature) {
        const val = parseFloat(temperature);
        if (val >= thresholds.temperature.critical_value) {
            await fireAlert(machine_id, 'threshold', 'critical', 'temperature', val, thresholds.temperature.critical_value, 'CRITICAL: Thermal Danger Zone', io);
        } else if (val >= thresholds.temperature.warning_value) {
            await fireAlert(machine_id, 'threshold', 'warning', 'temperature', val, thresholds.temperature.warning_value, 'WARNING: High Heat Operating Level', io);
        }
    }

    if (thresholds.vibration) {
        const val = parseFloat(vibration);
        if (val >= thresholds.vibration.critical_value) {
            await fireAlert(machine_id, 'threshold', 'critical', 'vibration', val, thresholds.vibration.critical_value, 'CRITICAL: Severe Mechanical Resonance', io);
        } else if (val >= thresholds.vibration.warning_value) {
            await fireAlert(machine_id, 'threshold', 'warning', 'vibration', val, thresholds.vibration.warning_value, 'WARNING: Elevation in Vibration Baseline', io);
        }
    }

    // 3. CHECK 2: TREND PREDICTION (The "Wow" Feature)
    // For simplicity, we check temperature trend for CNC and Pumps
    if (thresholds.temperature) {
        await checkTrend(machine_id, 'temperature', thresholds.temperature, io);
    }

    // 4. AUTO-RESOLVE LOGIC
    await autoResolve(machine_id, reading);
}

async function checkTrend(machine_id, metric, config, io) {
    // Query last 5 minutes (approx 150 readings)
    const rRes = await pool.query(
        `SELECT temperature FROM sensor_readings 
     WHERE machine_id = $1 AND time > NOW() - INTERVAL '5 minutes'
     ORDER BY time ASC`,
        [machine_id]
    );

    if (rRes.rows.length < 10) return; // Need some data

    const oldest = parseFloat(rRes.rows[0].temperature);
    const latest = parseFloat(rRes.rows[rRes.rows.length - 1].temperature);

    // Rate per minute (5 min window)
    const rate = (latest - oldest) / 5;

    if (rate >= config.trend_rate_threshold) {
        const timeToBreach = rate > 0 ? (config.critical_value - latest) / rate : 999;

        if (timeToBreach > 0 && timeToBreach <= 15) {
            await fireAlert(
                machine_id, 'trend', 'critical', metric, latest, config.critical_value,
                `PREDICTIVE: Critical breach projected in ${Math.round(timeToBreach)} minutes (Trend: +${rate.toFixed(2)}C/min)`,
                io
            );
        }
    }
}

async function fireAlert(machine_id, type, severity, metric, value, threshold, message, io) {
    // DEDUPLICATION: Don't fire if active alert for same machine/metric/type exists
    const dupCheck = await pool.query(
        `SELECT id FROM alerts 
     WHERE machine_id = $1 AND metric = $2 AND alert_type = $3 
     AND resolved_at IS NULL LIMIT 1`,
        [machine_id, metric, type]
    );

    if (dupCheck.rows.length > 0) return;

    const res = await pool.query(
        `INSERT INTO alerts (machine_id, alert_type, severity, metric, value, threshold, message)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [machine_id, type, severity, metric, value, threshold, message]
    );

    const newAlert = res.rows[0];

    // Join machine name for UI
    const mRes = await pool.query('SELECT * FROM machines WHERE id = $1', [machine_id]);
    const machine = mRes.rows[0];
    newAlert.machine_name = machine?.name;

    if (io) {
        io.emit('alert:new', newAlert);
    }

    // Send Notifications (Email/SMS)
    if (machine) {
        sendAlertNotification(newAlert, machine).catch(e => console.error('Notification Error:', e.message));
    }
}

async function autoResolve(machine_id, reading) {
    // Simplified resolve: if current temp < 70, resolve all temp alerts for machine
    if (parseFloat(reading.temperature) < 70) {
        await pool.query(
            `UPDATE alerts SET resolved_at = NOW() 
        WHERE machine_id = $1 AND metric = 'temperature' AND resolved_at IS NULL`,
            [machine_id]
        );
    }
}

module.exports = { startAlertEngine };
