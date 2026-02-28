require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');
const db = require('./db');

const trackRoutes = require('./routes/track');
const webhookRoutes = require('./routes/webhook');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

app.use(cors({
  origin: true, // Permite qualquer domínio
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'X-Webhook-Secret', 'X-Confirm-Delete'],
}));

app.use(express.json({ limit: '100kb' })); // Proteção contra Payload grande
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Rate Limit reforçado contra DDoS
const trackLimiter = rateLimit({ windowMs: 60 * 1000, max: 300, message: { error: 'Muitas requisições' } });
const dashLimiter = rateLimit({ windowMs: 60 * 1000, max: 100 });

app.use('/api/track', trackLimiter, trackRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/dashboard', dashLimiter, dashboardRoutes);
app.use('/dashboard', express.static(path.join(__dirname, 'views')));
app.use('/public', express.static(path.join(__dirname, '..', 'public'), { maxAge: '1h' }));

app.get('/health', (req, res) => res.json({ status: 'ok', version: '2.6.0', uptime: process.uptime() }));
app.get('/', (req, res) => res.json({ name: 'Worki Tracker API', version: '2.6.0' }));

// CRON JOB: Limpeza do Banco (Roda toda madrugada as 03:00)
cron.schedule('0 3 * * *', async () => {
  try {
    console.log('[CRON] Iniciando limpeza de eventos brutos antigos...');
    const res = await db.query(`
      DELETE FROM events 
      WHERE event_type IN ('pageview', 'scroll', 'click') 
      AND created_at < NOW() - INTERVAL '60 days'
    `);
    console.log(`[CRON] Sucesso: ${res.rowCount} eventos antigos removidos.`);
  } catch (err) {
    console.error('[CRON] Erro na limpeza:', err.message);
  }
});

app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  res.status(500).json({ error: 'Erro interno' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n══════════════════════════════════════`);
  console.log('  WORKI TRACKER v4.0');
  console.log(`  🚀 Porta ${PORT}`);
  console.log(`  📊 Dashboard: /dashboard/`);
  console.log(`══════════════════════════════════════\n`);
});

module.exports = app;
