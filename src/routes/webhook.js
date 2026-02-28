const express = require('express');
const router = express.Router();
const TrackingService = require('../services/tracking');

// ═══════════════════════════════════════
// POST /api/webhook/whatsapp
// Recebe webhooks da Evolution API
// ═══════════════════════════════════════
router.post('/whatsapp', async (req, res) => {
  try {
    const payload = req.body;
    console.log(`\n\n[WEBHOOK] Recebendo chamada da Evolution API...`);

    // Validar secret se configurado
    const secret = process.env.WEBHOOK_SECRET;
    if (secret) {
      const providedSecret = req.headers['x-webhook-secret'] || req.query.secret;
      if (providedSecret !== secret) {
        console.warn(`[WEBHOOK] Bloqueado: Secret inválido. Esperado '${secret}', Recebido '${providedSecret}'`);
        return res.status(401).json({ error: 'Secret inválido' });
      }
    }

    // Verificar se é evento de mensagem
    const event = payload.event || '';
    if (!event.includes('messages') && !event.includes('MESSAGES')) {
      // Eventos que não são mensagens (status, presence, etc) — ignorar
      return res.json({ ok: true, ignored: true, event });
    }

    console.log(`[WEBHOOK] Processando mensagem (event: ${event})`);
    const result = await TrackingService.processWhatsAppWebhook(payload);

    if (result.matched) {
      console.log(`[WEBHOOK] ✅ MATCH de Lead! Visitante ID: ${result.visitor_id}`);
    } else {
      console.log(`[WEBHOOK] ⚠️ NENHUM MATCH. Mensagem salva, mas não atrelada a nenhum visitante (Telefone: ${result.phone}).`);
    }

    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[WEBHOOK] ❌ Erro ao processar:', err.message);
    // Sempre retorna 200 pro webhook não ficar retentando
    res.json({ ok: false, error: err.message });
  }
});

module.exports = router;
