# IMMS — Industrial Machine Monitoring System

> Real-time anomaly detection and predictive alerting for industrial assets. Built for Projectathon 2.0, Arya College, March 14 2026.

**Live Demo:** [imms.abhisheksinghshekhawat.com](https://imms.abhisheksinghshekhawat.com)
**Login:** `engineer@imms.demo` / `imms2026`

---

## What It Does

IMMS monitors 6 industrial machines across 4 zones in real time. Sensor data streams every 2 seconds via WebSocket. The alert engine classifies anomalies as CRITICAL or WARNING and fires to the dashboard instantly — no manual refresh, no delay.

The problem it solves: most small and mid-size Indian factories have sensor hardware but no central monitoring layer. Unplanned machine downtime costs ₹50,000–₹5 lakh per hour. IMMS gives operators a live view of every machine and alerts them before failure happens.

---

## Live Screenshots

> Dashboard showing 6/6 live assets, CRITICAL alert on CNC Mill Line 1 at 94°C

---

## Features

- **Real-time WebSocket streaming** — sensor data updates every 2 seconds, all 6 machines
- **Anomaly alert engine** — CRITICAL / WARNING / INFO classification, auto-fires on threshold breach
- **Live Incident Feed** — alerts appear on dashboard in real time with acknowledge action
- **Machine detail view** — per-machine sensor history charts (30-minute window)
- **CSV export** — one-click download of full sensor history
- **JWT authentication** — secure login, session persists across refresh
- **Fully responsive** — works on mobile, tablet, and desktop
- **Cloud deployed** — Railway backend + Vercel frontend, custom domain

---

## Anomaly Schedule (Deterministic)

| Machine | Type | Behaviour |
|---|---|---|
| CNC Mill Line 1 | Temperature spike | Rises to 93°C for 2 min, every 45 min |
| Cooling Tower Pump | Temperature rise | +2.3°C/min for 12 min, every 60 min |
| Hydraulic Press A | Vibration surge | Rises to 9 mm/s over 10 min, every 2 hours |

Anomalies are scripted, not random. This ensures the demo always fires reliably in front of judges or clients.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool / dev server |
| Tailwind CSS | 3 | Utility-first styling |
| Recharts | 2 | Live sensor history charts |
| Zustand | 4 | Global state management |
| Socket.io-client | 4 | WebSocket real-time connection |
| Axios | latest | REST API calls |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 | Runtime |
| Express | 4 | REST API framework |
| Socket.io | 4 | WebSocket server |
| jsonwebtoken | latest | JWT auth |
| bcrypt | latest | Password hashing |
| pg | latest | PostgreSQL client |
| ioredis | latest | Redis client |

### Infrastructure
| Service | Purpose |
|---|---|
| PostgreSQL 15 (Railway) | Persistent sensor + alert storage |
| Redis 7 (Railway) | Pub/sub + caching |
| Railway | Backend cloud hosting, auto-deploy |
| Vercel | Frontend CDN, custom domain |
| Docker Compose | Local development |
| GitHub | Version control + CI/CD trigger |

---

## Architecture

```
Sensors / Simulator
       │
       ▼ (every 2000ms)
   Node.js Backend
       │
       ├── PostgreSQL ──── sensor_readings, alerts, machines, users
       │
       ├── Redis ────────── pub/sub event bus
       │
       └── Alert Engine ── threshold check → Socket.io emit
                                                    │
                                                    ▼
                                           React Frontend
                                           (Zustand store → re-render)
```

**Data flow:**
1. Simulator generates readings every 2s for all 6 machines
2. Inserts 4 rows per machine into `sensor_readings` (temp, vibration, energy, RPM)
3. Publishes Redis event
4. Alert engine receives event, checks thresholds, fires alert if breached
5. Socket.io broadcasts `new_reading` and `new_alert` to all connected clients
6. React dashboard re-renders — user sees updated data in under 1 second

---

## Database Schema

```sql
-- Machines
CREATE TABLE machines (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  zone       VARCHAR(50),
  status     VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensor readings (EAV format — one row per metric per tick)
CREATE TABLE sensor_readings (
  id          BIGSERIAL PRIMARY KEY,
  machine_id  UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  metric      VARCHAR(50) NOT NULL,   -- temperature | vibration | energy | rpm
  value       DECIMAL(10,4) NOT NULL,
  unit        VARCHAR(20),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
  id          BIGSERIAL PRIMARY KEY,
  machine_id  UUID REFERENCES machines(id),
  severity    VARCHAR(20) NOT NULL,   -- CRITICAL | WARNING | INFO
  metric      VARCHAR(50),
  value       DECIMAL(10,4),
  threshold   DECIMAL(10,4),
  message     TEXT,
  acked       BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(50) DEFAULT 'engineer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/login` | No | Login, returns JWT |
| GET | `/api/v1/machines` | Yes | List all machines |
| GET | `/api/v1/machines/:id` | Yes | Single machine detail |
| GET | `/api/v1/machines/:id/readings` | Yes | Sensor history |
| GET | `/api/v1/alerts` | Yes | All alerts |
| PATCH | `/api/v1/alerts/:id/acknowledge` | Yes | Acknowledge alert |
| GET | `/api/v1/export/csv` | Yes | Download sensor CSV |
| GET | `/api/v1/health` | No | Health check |

---

## Local Development

### Prerequisites
- Node.js 20+
- Docker Desktop (for PostgreSQL + Redis)
- Git

### Setup

```bash
# Clone
git clone https://github.com/AbhishekSinghShekhawatSDE/IMMS-V1.git
cd IMMS-V1

# Start database and cache
docker-compose up -d postgres redis

# Backend
cd backend
npm install
cp .env.example .env       # fill in values
node src/db/migrate.js     # create tables
node src/db/seed.js        # seed demo data
npm run dev                # starts on port 3001

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env       # set VITE_API_URL and VITE_WS_URL
npm run dev                # starts on port 5173
```

Open: `http://localhost:5173`
Login: `engineer@imms.demo` / `imms2026`

### Environment Variables

**Backend `.env`**
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/imms
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
SIMULATOR_INTERVAL_MS=2000
FRONTEND_URL=http://localhost:5173
```

**Frontend `.env`**
```
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=http://localhost:3001
```

---

## Deployment

### Backend — Railway

1. Create a new Railway project
2. Add PostgreSQL and Redis services
3. Deploy from GitHub (`backend/` as root directory)
4. Set environment variables (see above, use Railway's `${{Postgres.DATABASE_URL}}` references)
5. Set start command: `node src/index.js`
6. Run migrations and seed via Railway's terminal

### Frontend — Vercel

1. Import GitHub repo to Vercel
2. Set root directory to `frontend`
3. Set environment variables (`VITE_API_URL`, `VITE_WS_URL`)
4. Deploy — Vercel auto-detects Vite

---

## Demo Machines

| Machine | Zone | Base Temp | Base Vibration |
|---|---|---|---|
| CNC Mill Line 1 | Zone A | 68°C | 2.1 mm/s |
| CNC Mill Line 2 | Zone A | 65°C | 2.3 mm/s |
| Hydraulic Press A | Zone B | 72°C | 3.1 mm/s |
| Conveyor Belt 1 | Zone C | 55°C | 1.8 mm/s |
| Air Compressor Unit 3 | Zone B | 62°C | 2.5 mm/s |
| Cooling Tower Pump | Zone D | 48°C | 1.5 mm/s |

---

## Alert Thresholds

| Metric | WARNING | CRITICAL |
|---|---|---|
| Temperature | > 80°C | > 90°C |
| Vibration | > 7 mm/s | > 8.5 mm/s |

---

## Roadmap

- [x] Real-time WebSocket sensor streaming
- [x] Threshold-based alert engine
- [x] JWT authentication
- [x] Machine detail + history charts
- [x] CSV export
- [x] Cloud deployment (Railway + Vercel)
- [x] Fully responsive (mobile + tablet + desktop)
- [ ] Real hardware sensor integration (MQTT/HTTP bridge)
- [ ] Multi-tenant support (multiple factories)
- [ ] Role-based access control (plant manager / engineer / viewer)
- [ ] ML-based anomaly prediction
- [ ] SMS / WhatsApp alert delivery
- [ ] Mobile app (React Native)

---

## Project Structure

```
IMMS-V1/
├── backend/
│   ├── src/
│   │   ├── index.js          # Entry point
│   │   ├── simulator.js      # Machine data simulator
│   │   ├── alertEngine.js    # Threshold monitoring
│   │   ├── routes/           # Express API routes
│   │   ├── middleware/        # JWT auth middleware
│   │   └── db/
│   │       ├── migrate.js    # Schema creation
│   │       └── seed.js       # Demo data
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── pages/            # Dashboard, Machines, Alerts, Settings
│   │   ├── components/       # Sidebar, MachineCard, AlertFeed, Charts
│   │   └── store/            # Zustand state
│   ├── .env.example
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Built With

- Built for **Projectathon 2.0** — Arya Industrial Automation Club, Arya College
- Theme: Hardware / Software / Hybrid
- March 14, 2026

---

## Author

**Abhishek Singh Shekhawat**
GitHub: [@AbhishekSinghShekhawatSDE](https://github.com/AbhishekSinghShekhawatSDE)

---

## License

MIT
