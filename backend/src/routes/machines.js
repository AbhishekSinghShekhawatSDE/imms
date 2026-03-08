const express = require('express');
const router = express.Router();
const { pool, redis } = require('../db/connection');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// GET /api/v1/machines - List all machines with latest status
router.get('/', async (req, res) => {
    try {
        const mRes = await pool.query('SELECT * FROM machines ORDER BY name ASC');
        const machines = mRes.rows;

        // Attach latest readings from Redis for each
        const machinesWithLatest = await Promise.all(machines.map(async (m) => {
            const latest = await redis.get(`machine:${m.id}:latest`);
            return {
                ...m,
                latest: latest ? JSON.parse(latest) : null
            };
        }));

        res.json(machinesWithLatest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/v1/machines/:id - Single machine details
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // UUID format check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Invalid machine ID format' });
    }

    try {
        const mRes = await pool.query('SELECT * FROM machines WHERE id = $1', [id]);
        if (mRes.rows.length === 0) return res.status(404).json({ error: 'Machine not found' });

        const machine = mRes.rows[0];
        const latest = await redis.get(`machine:${machine.id}:latest`);

        // Fetch thresholds
        const tRes = await pool.query('SELECT * FROM alert_thresholds WHERE machine_id = $1', [machine.id]);

        res.json({
            machine: {
                ...machine,
                latest: latest ? JSON.parse(latest) : null,
                thresholds: tRes.rows
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/v1/machines/:id - Update status
router.patch('/:id', async (req, res) => {
    const { status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE machines SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/v1/machines/:id/readings - Historical readings for charting
router.get('/:id/readings', async (req, res) => {
    const { from, to, metric, limit = 500 } = req.query;
    const machineId = req.params.id;

    // UUID format check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(machineId)) {
        return res.status(400).json({ error: 'Invalid machine ID format' });
    }

    // Date validation
    if (from && isNaN(Date.parse(from))) {
        return res.status(400).json({ error: 'Invalid from date format' });
    }
    if (to && isNaN(Date.parse(to))) {
        return res.status(400).json({ error: 'Invalid to date format' });
    }

    let query = `
    SELECT time, temperature, vibration, energy, pressure, rpm 
    FROM sensor_readings 
    WHERE machine_id = $1
  `;
    const params = [machineId];

    if (from) {
        params.push(from);
        query += ` AND time >= $${params.length}`;
    } else {
        query += ` AND time >= NOW() - INTERVAL '1 hour'`;
    }

    if (to) {
        params.push(to);
        query += ` AND time <= $${params.length}`;
    }

    query += ` ORDER BY time ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    try {
        const result = await pool.query(query, params);
        res.json({
            machine_id: machineId,
            readings: result.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
