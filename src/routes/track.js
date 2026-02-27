const express = require('express');
const router = express.Router();
const TrackingService = require('../services/tracking');

router.post('/events', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    if (events.length === 0) return res.status(400).json({ error: 'Nenhum evento' });
    if (events.length > 50) return res.status(400).json({ error: 'Máximo 50 eventos' });

    const reqInfo = {
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
      userAgent: req.headers['user-agent'] || null
    };

    const result = await TrackingService.processEvents(events, reqInfo);
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

// Geo proxy — resolve CORS, lookup server-side usando IP do visitante
router.get('/geo', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    // ip-api.com funciona em HTTP server-side (sem restrição de CORS)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,zip&lang=pt-BR`);
    const data = await response.json();
    if (data.status === 'success') {
      res.json({ city: data.city, state: data.regionName, country: data.country, zip_code: data.zip });
    } else {
      res.json({ city: null, state: null, country: null, zip_code: null });
    }
  } catch (err) {
    res.json({ city: null, state: null, country: null, zip_code: null });
  }
});

module.exports = router;
