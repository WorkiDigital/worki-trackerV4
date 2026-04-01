const express = require('express');
const router = express.Router();
const TrackingService = require('../services/tracking');

// ═══════════════════════════════════════
// POST /api/webhook/hotmart?hottok=TOKEN
// Recebe webhooks da Hotmart e envia para Meta CAPI
// ═══════════════════════════════════════
router.post('/hotmart', async (req, res) => {
  // Sempre retorna 200 para evitar retentativas da Hotmart
  try {
    const payload = req.body;
    const event = payload.event || '';
    console.log(`\n[HOTMART] Webhook recebido: ${event}`);

    // Validar hottok
    const token = process.env.HOTMART_TOKEN;
    if (token) {
      const provided = req.query.hottok || req.headers['x-hotmart-hottok'];
      if (provided !== token) {
        console.warn('[HOTMART] Bloqueado: hottok inválido.');
        return res.json({ ok: false, error: 'Token inválido' });
      }
    }

    const result = await TrackingService.processHotmartWebhook(payload);

    if (result.processed) {
      console.log(`[HOTMART] ✅ ${result.meta_event} enviado ao Meta CAPI. Match: ${result.matched} | Visitor: ${result.visitor_id || 'não encontrado'}`);
    } else {
      console.log(`[HOTMART] ⏭️ Ignorado: ${result.reason}`);
    }

    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[HOTMART] ❌ Erro:', err.message);
    res.json({ ok: false, error: err.message });
  }
});

module.exports = router;
