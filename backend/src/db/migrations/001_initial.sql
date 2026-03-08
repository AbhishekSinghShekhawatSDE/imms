-- machines
CREATE TABLE IF NOT EXISTS machines (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  location   VARCHAR(100),
  type       VARCHAR(50),
  status     VARCHAR(20) DEFAULT 'active'
             CHECK (status IN ('active','idle','maintenance','offline')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- sensor readings as TimescaleDB hypertable
CREATE TABLE IF NOT EXISTS sensor_readings (
  time        TIMESTAMPTZ NOT NULL,
  machine_id  UUID REFERENCES machines(id) ON DELETE CASCADE,
  temperature FLOAT,
  vibration   FLOAT,
  energy      FLOAT,
  pressure    FLOAT,
  rpm         FLOAT
);

-- Convert to hypertable if not already (Postgres 13+ supports if_not_exists in SQL but not all versions)
-- We'll handle this in the JS migration script for safety or rely on the extension being active.
-- For this demo, we assume TimescaleDB extension is active.
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_name = 'sensor_readings') THEN
    PERFORM create_hypertable('sensor_readings', 'time');
  END IF;
END $$;

-- alerts
CREATE TABLE IF NOT EXISTS alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id      UUID REFERENCES machines(id),
  alert_type      VARCHAR(20) CHECK (alert_type IN ('threshold','trend','anomaly')),
  severity        VARCHAR(10) CHECK (severity IN ('warning','critical')),
  metric          VARCHAR(50),
  value           FLOAT,
  threshold       FLOAT,
  message         TEXT,
  acknowledged    BOOLEAN DEFAULT false,
  acknowledged_by VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- thresholds
CREATE TABLE IF NOT EXISTS alert_thresholds (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id           UUID REFERENCES machines(id),
  metric               VARCHAR(50),
  warning_value        FLOAT,
  critical_value       FLOAT,
  trend_window_minutes INTEGER DEFAULT 5,
  trend_rate_threshold FLOAT,
  UNIQUE(machine_id, metric)
);
