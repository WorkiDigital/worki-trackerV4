const express = require('express');
const router = express.Router();
const TrackingService = require('../services/tracking');

router.post('/events', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    console.log(`📥 [v5.0] Recebido ${events.length} evento(s)`);
    
    if (events.length === 0) return res.status(400).json({ error: 'Nenhum evento' });
    if (events.length > 50) return res.status(400).json({ error: 'Máximo 50 eventos' });

    const reqInfo = {
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
      userAgent: req.headers['user-agent'] || null
    };

    // Log dos eventos recebidos
    events.forEach(e => {
      console.log(`  └─ ${e.event} | Visitor: ${e.visitor_id?.substring(0, 12)}...`);
      if (e.event === 'pageview' && e.data?.geo) {
        console.log(`     📍 Geo: ${e.data.geo.city || '?'}, ${e.data.geo.state || '?'}, ${e.data.geo.country || '?'}`);
      }
    });

    const result = await TrackingService.processEvents(events, reqInfo);
    console.log(`✅ Processado: ${result.processed} eventos, ${result.errors} erros`);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Erro /track/events:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/match', async (req, res) => {
  try {
    const { phone, email, source, value, product, payment, data } = req.body;
    if (!phone && !email) return res.status(400).json({ error: 'Informe phone ou email para match' });
    const result = await TrackingService.matchConversion({ phone, email, source, value, product, payment, data });
    res.json(result);
  } catch (err) {
    console.error('Erro /track/match:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
