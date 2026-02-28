const express = require('express');
const router = express.Router();
const TrackingService = require('../services/tracking');

router.post('/events', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    console.log(`\n[TRACK API] Recebendo batch de ${events.length} eventos.`);
    if (events.length === 0) {
      console.warn('[TRACK API] ⚠️ Rejeitado: Nenhum evento recebido no payload.');
      return res.status(400).json({ error: 'Nenhum evento' });
    }
    if (events.length > 50) {
      console.warn('[TRACK API] ⚠️ Rejeitado: Payload excedeu 50 eventos.');
      return res.status(400).json({ error: 'Máximo 50 eventos' });
    }

    const reqInfo = {
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
      userAgent: req.headers['user-agent'] || null,
      origin: req.headers.origin || req.headers.referer || null
    };

    // First-Party Cookie (ITP bypass)
    if (events.length > 0 && events[0].visitor_id) {
      const pid = events[0].project_id || 1;
      const cname = `wk_vid_${pid}`;
      res.cookie(cname, events[0].visitor_id, { maxAge: 31536000000, httpOnly: false, sameSite: 'Lax', secure: true });
    }

    const result = await TrackingService.processEvents(events, reqInfo);
    console.log(`[TRACK API] ✅ Batch processado. Sucesso: ${result.processed}, Erros: ${result.errors}, Cors/Block: ${result.blocked_cors}`);
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

\nmodule.exports = router;
