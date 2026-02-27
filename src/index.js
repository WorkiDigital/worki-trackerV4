require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const trackRoutes = require('./routes/track');
const webhookRoutes = require('./routes/webhook');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

const origins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origins.length === 0 || origins.includes(origin)) return cb(null, true);
    cb(new Error('CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'X-Webhook-Secret', 'X-Confirm-Delete'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/track', rateLimit({ windowMs: 60000, max: 120 }), trackRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/dashboard', rateLimit({ windowMs: 60000, max: 60 }), dashboardRoutes);
app.use('/dashboard', express.static(path.join(__dirname, 'views')));
app.use('/public', express.static(path.join(__dirname, '..', 'public'), { maxAge: '1h' }));

app.get('/health', (req, res) => res.json({ status: 'ok', version: '2.5.0', uptime: process.uptime() }));
app.get('/', (req, res) => res.json({ name: 'Worki Tracker API', version: '2.5.0' }));

app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  res.status(500).json({ error: 'Erro interno' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n══════════════════════════════════════`);
  console.log(`  WORKI TRACKER v2.5`);
  console.log(`  🚀 Porta ${PORT}`);
  console.log(`  📊 Dashboard: /dashboard/`);
  console.log(`══════════════════════════════════════\n`);
});

module.exports = app;
