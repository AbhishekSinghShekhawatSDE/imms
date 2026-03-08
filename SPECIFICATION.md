# INDUSTRIAL MACHINE MONITORING SYSTEM (IMMS v1.0)
## Full Product Specification | PRD | Technical Architecture

### 1. Product Overview
IMMS is a real-time web application that monitors industrial machines by collecting sensor data, detecting anomalies, predicting failures before they occur, and alerting engineers instantly. It replaces manual machine inspections with a live dashboard accessible from any browser.

The core insight: most industrial machine failures give warning signs 10 to 60 minutes before they happen. Temperature spikes. Vibration pattern shifts. Energy draw increases. IMMS reads these signals and acts before the machine fails.

#### 1.1 The Problem It Solves
| Problem | Current State | IMMS Solution |
| :--- | :--- | :--- |
| Unplanned downtime | Machine fails without warning. Production stops. | Predictive alerts fire before failure. Team intervenes early. |
| Manual monitoring | Engineer walks the floor every 2 hours. | Continuous automated monitoring. 24/7. |
| No historical data | Cannot identify patterns or recurring issues. | Full time-series database. Trend analysis built in. |
| Slow incident response | Alert reaches engineer 30+ minutes after failure. | Push notification within 5 seconds of threshold breach. |
| No root cause analysis | Engineers guess at failure cause. | Dashboard shows correlated sensor data at failure time. |

---

### 2. Product Requirements Document (PRD)

#### 2.1 Goals
- Deliver real-time machine health data to a web dashboard with under 2 second latency
- Detect anomalies using threshold-based rules and trend analysis
- Fire multi-channel alerts (browser, email, SMS) within 5 seconds of a breach
- Store all sensor data with full query history
- Support at least 10 concurrent machine monitors in MVP

#### 2.2 Feature List by Priority
| Priority | Feature | Description | Version |
| :--- | :--- | :--- | :--- |
| P0 | Live Dashboard | Real-time charts for temperature, vibration, energy per machine | v1.0 |
| P0 | Simulated Sensor Data | Realistic data generator with injected anomalies | v1.0 |
| P0 | Threshold Alerts | Red/yellow/green status per machine per metric | v1.0 |
| P0 | Alert Feed | Chronological list of all alerts with timestamp and machine ID | v1.0 |
| P1 | Trend Prediction | Rule-based (rate of change analysis) | v1.0 |
| P1 | Historical Charts | View sensor data for past 24 hours | v1.0 |
| P1 | Email Alerts | Send email on P0 alert trigger | v1.0 |
| P2 | Machine Detail Page | Per-machine deep dive and history | v1.0 |

#### 2.3 User Stories
- **Engineer**: As an engineer, I want to see all machine statuses on one screen so I know where to focus.
- **Operations Manager**: As a manager, I want to see overall fleet uptime percentage so I can report to leadership.

---

### 3. System Architecture

#### 3.1 Overview
IMMS use a three-layer architecture: a data layer that generates and stores sensor readings, an API layer that processes and serves data, and a frontend layer that visualizes everything in real time.

| Layer | Component | Technology | Responsibility |
| :--- | :--- | :--- | :--- |
| **Data** | Sensor Simulator | Node.js | Generates realistic machine sensor data every 2 seconds |
| **Data** | Time-Series DB | TimescaleDB | Stores all sensor readings with timestamps |
| **Data** | Cache | Redis | Holds latest reading per machine for sub-10ms dashboard reads |
| **API** | REST API | Node.js + Express | CRUD endpoints for machines, readings, alerts |
| **API** | WebSocket Server | Socket.io | Pushes live sensor updates to connected dashboards |
| **API** | Alert Engine | Node.js | Evaluates thresholds and trend rules, fires alerts |
| **Frontend** | Dashboard UI | React + Vite | Real-time charts, alert feed, machine status grid |

#### 3.2 Data Flow
1. **Sensor Simulator** generates readings every 2 seconds and writes to TimescaleDB and Redis.
2. **Alert Engine** evaluates threshold/trend rules and writes alerts to PostgreSQL alerts table.
3. **WebSocket Server** pushes live readings and alerts to browser clients via Socket.io.
4. **React Frontend** updates charts and alert feed in real time.

---

### 4. Database Schema

#### 4.1 Tables
- **`machines`**: `id`, `name`, `location`, `type`, `status`, `created_at`, `updated_at`
- **`sensor_readings` (hypertable)**: `time`, `machine_id`, `temperature`, `vibration`, `energy`, `pressure`, `rpm`
- **`alerts`**: `id`, `machine_id`, `alert_type`, `severity`, `metric`, `value`, `threshold`, `message`, `acknowledged`, `acknowledged_by`, `created_at`, `resolved_at`
- **`alert_thresholds`**: `id`, `machine_id`, `metric`, `warning_value`, `critical_value`, `trend_window_minutes`, `trend_rate_threshold`

---

### 5. API Specification

#### 5.1 REST Endpoints (Base: `/api/v1`)
- `GET /machines` - List all machines
- `GET /machines/:id` - Single machine details
- `POST /machines` - Create machine record
- `PATCH /machines/:id` - Update status/metadata
- `GET /machines/:id/readings` - Historical readings (query params: `from`, `to`, `metric`)
- `GET /machines/:id/readings/latest` - Latest reading
- `GET /alerts` - List alerts
- `PATCH /alerts/:id/acknowledge` - Acknowledge an alert
- `GET /thresholds` - Configured thresholds
- `GET /dashboard/summary` - Fleet stats (uptime, alert counts)
- `POST /auth/login` - Login with JWT

#### 5.2 WebSocket Events
- `sensor:reading` (Server -> Client) - New sensor reading
- `alert:new` (Server -> Client) - Alert triggered
- `alert:resolved` (Server -> Client) - Alert auto-resolved
- `machine:status` (Server -> Client) - Machine status change
- `subscribe:machine` (Client -> Server) - Subscribe to specific updates

---

### 6. Alert System

#### 6.1 Prediction Algorithm
- **Type 2 (Trend)**: Calculate rolling average rate of change over the last 5 minutes.
- **Rule**: `current_value + (rate_per_minute * prediction_window_minutes) >= critical_threshold`
- **Alert message**: "Temperature trending toward critical. Estimated breach in 8 minutes."

#### 6.2 Severity Matrix
- **Warning**: Dashboard + Email. Escalate to Critical after 15 min if unresolved.
- **Critical**: Dashboard + Email + SMS. Re-alert every 5 minutes until acknowledged.

---

### 7. Frontend Specification
- **Color System**: Green (#10B981), Amber (#F59E0B), Red (#EF4444), Grey (#6B7280), Blue (#3B82F6), Orange (#F97316).
- **Components**: Gauge charts, Line charts (past 24h), Machine Detail (Prediction Panel, Event Log), Fleet Status Bar.

---

### 8. Full Tech Stack
- **Frontend**: React 18, Vite 5, Tailwind CSS 3, Recharts 2, Zustand 4, Axios 1, Socket.io-client 4.
- **Backend**: Node.js 20 LTS, Express 4, Socket.io 4, jsonwebtoken, bcrypt, Zod 3, Nodemailer 6, Twilio SDK 4.
- **Data**: PostgreSQL 15, TimescaleDB, Redis 7.
- **Infra**: Docker, Docker Compose, Nginx.

---

### 9. Build Roadmap (7-Day)
- **Day 1**: Monorepo setup, Docker infra (Postgres, Timescale, Redis), Scaffold React & Express.
- **Day 2**: Database schema, initial sensors API.
- **Day 3**: Sensor Simulator implementation (Real-time generators).
- **Day 4**: WebSocket implementation (Live Dashboard).
- **Day 5**: Alert Engine (Thresholds, Predictions, Emails).
- **Day 6**: Machine Detail page and historical analysis.
- **Day 7**: Testing, Demo Preparation, Documentation.

---

### 10. Demo Script & Q&A
See [README.md](README.md) for demo cues. 

- **Q: How would you connect real hardware?**
- **A: Replace the simulator with an MQTT broker. Backend subscribes to sensor topics.**

---

### 11. Success Metrics
- **Dashboard latency**: < 2 seconds.
- **Alert latency**: < 5 seconds.
- **Winning Criteria**: Live moving data, trend prediction firing, end-to-end workflow demonstration.

---
IMMS v1.0 | Full Product Specification | March 2026
