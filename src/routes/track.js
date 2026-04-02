const express = require('express');
const router = express.Router();
const TrackingService = require('../services/tracking');

// Extrai o domínio raiz removendo o primeiro subdomínio
// Ex: tracker.meusite.com.br → .meusite.com.br
function getRootDomain(host) {
  const h = host.split(':')[0]; // remove porta se houver
  const parts = h.split('.');
  if (parts.length <= 2) return '.' + h;
  return '.' + parts.slice(1).join('.');
}

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

    // ═══ Subdomain Mode: Set-Cookie 1st Party Server-Side ═══
    const host = (req.headers.host || '').split(':')[0];
    const isCustomDomain = host && host !== 'tracker.workidigital.tech' && host !== 'localhost';
    if (isCustomDomain && events.length > 0) {
      const rootDomain = getRootDomain(host);
      const cookieOpts = { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'Lax', secure: true, domain: rootDomain };

      // wk_vid (visitor_id) — 1st party server-side
      if (events[0].visitor_id) {
        const pid = events[0].project_id || 1;
        res.cookie(`wk_vid_p${pid}`, events[0].visitor_id, cookieOpts);
      }
      // _fbp — se veio no evento e ainda não existe no cookie
      const fbp = events[0].data?.fbp;
      if (fbp && !req.cookies?._fbp) {
        res.cookie('_fbp', fbp, cookieOpts);
        console.log(`[SUBDOMAIN] Set-Cookie _fbp=${fbp} Domain=${rootDomain}`);
      }
      // _fbc — se veio no evento
      const fbc = events[0].data?.fbc;
      if (fbc && !req.cookies?._fbc) {
        res.cookie('_fbc', fbc, cookieOpts);
        console.log(`[SUBDOMAIN] Set-Cookie _fbc=${fbc} Domain=${rootDomain}`);
      }
    } else {
      // Script Mode: First-Party Cookie via JS (comportamento original)
      if (events.length > 0 && events[0].visitor_id) {
        const pid = events[0].project_id || 1;
        res.cookie(`wk_vid_${pid}`, events[0].visitor_id, { maxAge: 31536000000, httpOnly: false, sameSite: 'Lax', secure: true });
      }
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

module.exports = router;
