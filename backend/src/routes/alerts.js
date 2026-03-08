const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// GET /api/v1/alerts - List alerts with filters
router.get('/', async (req, res) => {
    const { machine_id, severity, acknowledged } = req.query;
    let query = `
    SELECT a.*, m.name as machine_name 
    FROM alerts a 
    JOIN machines m ON a.machine_id = m.id 
    WHERE 1=1
  `;
    const params = [];

    if (machine_id) {
        params.push(machine_id);
        query += ` AND machine_id = $${params.length}`;
    }
    if (severity) {
        params.push(severity);
        query += ` AND severity = $${params.length}`;
    }
    if (acknowledged !== undefined) {
        params.push(acknowledged === 'true');
        query += ` AND acknowledged = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/v1/alerts/:id/acknowledge
router.patch('/:id/acknowledge', async (req, res) => {
    const { acknowledged_by } = req.body;
    try {
        const result = await pool.query(
            `UPDATE alerts 
       SET acknowledged = true, acknowledged_by = $1, resolved_at = NOW() 
       WHERE id = $2 RETURNING *`,
            [acknowledged_by || 'Demo Engineer', req.params.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });

        // Emit via socket
        const io = req.app.get('socketio');
        if (io) io.emit('alert:acknowledged', result.rows[0]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
