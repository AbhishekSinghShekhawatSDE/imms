const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const DEMO_USER = {
    email: 'engineer@imms.demo',
    password: 'imms2026',
    name: 'Demo Engineer'
};

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (email === DEMO_USER.email && password === DEMO_USER.password) {
        const token = jwt.sign(
            { email: DEMO_USER.email, name: DEMO_USER.name },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        return res.json({
            token,
            user: { name: DEMO_USER.name, email: DEMO_USER.email }
        });
    }

    res.status(401).json({ error: 'Invalid credentials' });
});

module.exports = router;
