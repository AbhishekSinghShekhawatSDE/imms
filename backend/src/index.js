require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

process.on('uncaughtException', (err) => {
  console.error('--- UNCAUGHT EXCEPTION ---', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('--- UNHANDLED REJECTION ---', err);
});
const machineRoutes = require('./routes/machines');
const alertRoutes = require('./routes/alerts');
const readingRoutes = require('./routes/readings');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Pass io to express app for routes to use
app.set('socketio', io);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/machines', machineRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/readings', readingRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Basic Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('subscribe:machine', (data) => {
    const { machine_id } = data;
    console.log(`Subscribing socket ${socket.id} to machine: ${machine_id}`);
    socket.join(`machine:${machine_id}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const { pool, redis } = require('./db/connection');
const { startSimulator } = require('./services/simulator');
const { startAlertEngine } = require('./services/alertEngine');

// Connectivity check
const checkConnectivity = async () => {
  console.log('--- Starting System Checks ---');
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('--- Connected to TimescaleDB at:', res.rows[0].now);
  } catch (err) {
    console.warn('--- Database connection not yet ready (Waiting for Docker)...');
  }

  try {
    const redisStatus = await redis.ping();
    console.log('--- Connected to Redis:', redisStatus);
  } catch (err) {
    console.warn('--- Redis connection not yet ready (Waiting for Docker)...');
  }
};

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Serve React app for all non-API routes (Express 5 compatible SPA routing)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.includes('.')) {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  } else {
    next();
  }
});

// Start Everything
const PORT = process.env.PORT || 3001;

// Init DB connections and then start everything conditionally
if (process.env.NODE_ENV !== 'test') {
  checkConnectivity().then(() => {
    server.listen(PORT, async () => {
      console.log(`--- [IMMS v1.0] API Server Ready on Port ${PORT} ---`);
      console.log(`Health check: http://localhost:${PORT}/api/v1/health`);

      // 1. Launch Alert Engine (Subscribes to Redis updates)
      console.log('--- [IMMS v1.0] Launching Alert Engine ---');
      await startAlertEngine(io);

      // 2. Launch Sensor Simulator (Publishes to DB and Redis)
      console.log('--- [IMMS v1.0] Launching Sensor Simulator ---');
      await startSimulator(io, redis);
    });
  });
}

module.exports = { app, server };
