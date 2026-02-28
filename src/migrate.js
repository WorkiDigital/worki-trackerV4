require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migration = `

-- ═══════════════════════════════════════════
-- WORKI TRACKER — Database Schema v4.1
-- Multi-Project
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  fb_pixel_id VARCHAR(100),
  fb_access_token TEXT,
  allowed_domains TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create default project
INSERT INTO projects (id, name) VALUES (1, 'Projeto Principal') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS visitors (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE DEFAULT 1,
  visitor_id VARCHAR(100) UNIQUE NOT NULL,
  fingerprint TEXT,
  name VARCHAR(200),
  email VARCHAR(200),
  phone VARCHAR(30),
  empresa VARCHAR(200),
  instagram VARCHAR(100),
  fbclid TEXT,
  fbc TEXT,
  fbp TEXT,
  client_ip VARCHAR(45),
  client_user_agent TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  zip_code VARCHAR(20),
  first_seen TIMESTAMP DEFAULT NOW(),
  first_utm_source VARCHAR(100),
  first_utm_medium VARCHAR(100),
  first_utm_campaign VARCHAR(200),
  first_utm_term VARCHAR(200),
  first_utm_content VARCHAR(200),
  first_referrer TEXT,
  device_type VARCHAR(100),
  device_os VARCHAR(200),
  device_browser VARCHAR(200),
  device_screen VARCHAR(100),
  total_visits INTEGER DEFAULT 1,
  total_pageviews INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  max_scroll_depth INTEGER DEFAULT 0,
  status VARCHAR(100) DEFAULT 'visiting',
  converted BOOLEAN DEFAULT FALSE,
  conversion_value DECIMAL(12,2),
  conversion_source VARCHAR(100),
  conversion_date TIMESTAMP,
  days_to_convert INTEGER,
  whatsapp_contacted BOOLEAN DEFAULT FALSE,
  whatsapp_date TIMESTAMP,
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE DEFAULT 1,
  visitor_id VARCHAR(100) NOT NULL,
  session_id VARCHAR(100),
  event_type VARCHAR(100) NOT NULL,
  page VARCHAR(500),
  url TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE DEFAULT 1,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  visitor_id VARCHAR(100) NOT NULL,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(200),
  utm_term VARCHAR(200),
  utm_content VARCHAR(200),
  referrer TEXT,
  device_type VARCHAR(100),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_seconds INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS conversions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE DEFAULT 1,
  visitor_id VARCHAR(100) NOT NULL,
  source VARCHAR(100),
  value DECIMAL(12,2),
  product VARCHAR(500),
  payment VARCHAR(200),
  order_id VARCHAR(200),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE DEFAULT 1,
  visitor_id VARCHAR(100),
  phone VARCHAR(30) NOT NULL,
  push_name VARCHAR(200),
  message TEXT,
  from_me BOOLEAN DEFAULT FALSE,
  raw_data JSONB DEFAULT '{}',
  matched BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Safe migration: alter tables
DO $$ BEGIN
  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE DEFAULT 1;
  UPDATE visitors SET project_id = 1 WHERE project_id IS NULL;

  ALTER TABLE events ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE DEFAULT 1;
  UPDATE events SET project_id = 1 WHERE project_id IS NULL;

  ALTER TABLE sessions ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE DEFAULT 1;
  UPDATE sessions SET project_id = 1 WHERE project_id IS NULL;

  ALTER TABLE conversions ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE DEFAULT 1;
  UPDATE conversions SET project_id = 1 WHERE project_id IS NULL;

  ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE DEFAULT 1;
  UPDATE whatsapp_messages SET project_id = 1 WHERE project_id IS NULL;

  ALTER TABLE projects ADD COLUMN IF NOT EXISTS allowed_domains TEXT;

  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);
  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS fbclid TEXT;
  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS fbc TEXT;
  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS fbp TEXT;
  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS first_utm_term VARCHAR(200);
  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS first_utm_content VARCHAR(200);
  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS client_ip VARCHAR(45);
  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS client_user_agent TEXT;
  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS city VARCHAR(100);
  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS state VARCHAR(100);
  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS country VARCHAR(100);
  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
  ALTER TABLE visitors ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(100);

  ALTER TABLE visitors ALTER COLUMN fingerprint TYPE TEXT;
  ALTER TABLE visitors ALTER COLUMN device_type TYPE VARCHAR(100);
  ALTER TABLE visitors ALTER COLUMN device_os TYPE VARCHAR(200);
  ALTER TABLE visitors ALTER COLUMN device_browser TYPE VARCHAR(200);
  ALTER TABLE visitors ALTER COLUMN device_screen TYPE VARCHAR(100);
  ALTER TABLE visitors ALTER COLUMN status TYPE VARCHAR(100);
  
  ALTER TABLE events ALTER COLUMN event_type TYPE VARCHAR(100);
  ALTER TABLE sessions ALTER COLUMN device_type TYPE VARCHAR(100);
  ALTER TABLE conversions ALTER COLUMN payment TYPE VARCHAR(200);
  ALTER TABLE conversions ALTER COLUMN order_id TYPE VARCHAR(200);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_projects_id ON projects(id);
CREATE INDEX IF NOT EXISTS idx_visitors_project ON visitors(project_id);
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_conversions_project ON conversions(project_id);

CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_phone ON visitors(phone);
CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_fingerprint ON visitors(fingerprint);
CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON visitors(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_first_seen ON visitors(first_seen DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_instagram ON visitors(instagram);
CREATE INDEX IF NOT EXISTS idx_visitors_fbc ON visitors(fbc);
CREATE INDEX IF NOT EXISTS idx_visitors_fbp ON visitors(fbp);
CREATE INDEX IF NOT EXISTS idx_visitors_converted ON visitors(converted);
CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_conversions_visitor ON conversions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created ON conversions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone ON whatsapp_messages(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_visitor ON whatsapp_messages(visitor_id);
`;

async function migrate() {
  console.log('🔄 Migração v4.1...\n');
  try {
    await pool.query(migration);
    console.log('✅ Schema v4.1 OK\n🎉 Migração completa!\n');
  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
