const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// GET /api/v1/dashboard/summary
router.get('/summary', async (req, res) => {
    try {
        const totalRes = await pool.query('SELECT COUNT(*) FROM machines');
        const onlineRes = await pool.query("SELECT COUNT(*) FROM machines WHERE status = 'active'");
        const alertRes = await pool.query(`
      SELECT severity, COUNT(*) 
      FROM alerts 
      WHERE resolved_at IS NULL AND acknowledged = false 
      GROUP BY severity
    `);

        const alerts = alertRes.rows.reduce((acc, row) => ({ ...acc, [row.severity]: parseInt(row.count) }), { warning: 0, critical: 0 });

        const total = parseInt(totalRes.rows[0].count);
        const online = onlineRes.rows[0].count;

        res.json({
            total_machines: total,
            online: parseInt(online),
            active_alerts: alerts,
            uptime_percent: total > 0 ? (online / total) * 100 : 100,
            last_updated: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
