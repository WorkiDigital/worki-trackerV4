const crypto = require('crypto');

class MetaService {
  constructor() {
    this.apiVersion = 'v19.0';
  }

  hashSHA256(value) {
    if (!value) return null;
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
  }

  normalizePhone(phone) {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, '');
    // Garante formato internacional +55
    if (clean.length === 11 || clean.length === 10) return '55' + clean;
    if (clean.startsWith('55')) return clean;
    return clean;
  }

  async sendEvent(eventName, visitor, data = {}, pixelId, accessToken) {
    if (!pixelId || !accessToken) return null;

    try {
      const now = Math.floor(Date.now() / 1000);

      const userData = {};
      if (visitor.email) userData.em = [this.hashSHA256(visitor.email)];
      if (visitor.phone) userData.ph = [this.hashSHA256(this.normalizePhone(visitor.phone))];
      if (visitor.name) {
        const parts = visitor.name.trim().split(/\s+/);
        userData.fn = [this.hashSHA256(parts[0])];
        if (parts.length > 1) userData.ln = [this.hashSHA256(parts[parts.length - 1])];
      }
      if (visitor.city) userData.ct = [this.hashSHA256(visitor.city)];
      if (visitor.state) userData.st = [this.hashSHA256(visitor.state)];
      if (visitor.country) userData.country = [this.hashSHA256(visitor.country)];
      if (visitor.zip_code) userData.zp = [this.hashSHA256(visitor.zip_code)];
      if (visitor.client_ip) userData.client_ip_address = visitor.client_ip;
      if (visitor.client_user_agent) userData.client_user_agent = visitor.client_user_agent;
      if (visitor.fbc) userData.fbc = visitor.fbc;
      if (visitor.fbp) userData.fbp = visitor.fbp;
      if (visitor.visitor_id) userData.external_id = [this.hashSHA256(visitor.visitor_id)];

      const eventData = {
        event_name: eventName,
        event_time: now,
        event_id: `${visitor.visitor_id}_${eventName}_${now}`,
        action_source: 'website',
        user_data: userData,
      };

      if (data.url) eventData.event_source_url = data.url;
      if (data.value) {
        eventData.custom_data = {
          value: parseFloat(data.value),
          currency: 'BRL',
          ...(data.product && { content_name: data.product }),
        };
      }

      const url = `https://graph.facebook.com/${this.apiVersion}/${pixelId}/events?access_token=${accessToken}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [eventData] }),
      });

      const result = await response.json();

      if (result.error) {
        console.error('❌ Meta CAPI erro:', result.error.message);
        return { ok: false, error: result.error.message };
      }

      console.log(`✅ Meta CAPI: ${eventName} enviado (${result.events_received} evento(s))`);
      return { ok: true, events_received: result.events_received };
    } catch (err) {
      console.error('❌ Meta CAPI falha:', err.message);
      return { ok: false, error: err.message };
    }
  }
}

const metaService = new MetaService();
module.exports = metaService;
