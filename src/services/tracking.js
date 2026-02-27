const db = require('../db');
const metaService = require('./meta');

const TrackingService = {

  // ═══════════════════════════════════════
  // PROJETOS
  // ═══════════════════════════════════════
  async getProjects() {
    return db.many('SELECT id, name, fb_pixel_id, fb_access_token, created_at FROM projects ORDER BY created_at ASC');
  },
  async createProject(data) {
    return db.one(
      'INSERT INTO projects (name, fb_pixel_id, fb_access_token) VALUES ($1, $2, $3) RETURNING *',
      [data.name, data.fb_pixel_id, data.fb_access_token]
    );
  },
  async updateProject(id, data) {
    return db.one(
      'UPDATE projects SET name=$1, fb_pixel_id=$2, fb_access_token=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [data.name, data.fb_pixel_id, data.fb_access_token, id]
    );
  },
  async deleteProject(id) {
    const existing = await db.one('SELECT id FROM projects WHERE id=$1', [id]);
    if (!existing) return null;
    await db.query('DELETE FROM projects WHERE id=$1', [id]);
    return { id };
  },

  // ═══════════════════════════════════════
  // PROCESSAR BATCH DE EVENTOS
  // ═══════════════════════════════════════
  async processEvents(events, reqInfo = {}) {
    const results = { processed: 0, errors: 0 };
    for (const event of events) {
      try {
        await this.upsertVisitor(event, reqInfo);
        await db.query(
          `INSERT INTO events (project_id, visitor_id, session_id, event_type, page, url, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [event.project_id || 1, event.visitor_id, event.session_id, event.event, event.page, event.url, JSON.stringify(event.data || {})]
        );
        switch (event.event) {
          case 'pageview': await this.processPageview(event); break;
          case 'scroll': await this.processScroll(event); break;
          case 'click': await this.processClick(event); break;
          case 'form_submit': await this.processFormSubmit(event); break;
          case 'identify': await this.processIdentify(event); break;
          case 'conversion': await this.processConversion(event); break;
          case 'page_exit': await this.processPageExit(event); break;
        }
        results.processed++;
      } catch (err) {
        console.error(`Erro processando ${event.event}:`, err.message);
        results.errors++;
      }
    }
    return results;
  },

  // ═══════════════════════════════════════
  // UPSERT VISITOR (v2 com Meta + Geo)
  // ═══════════════════════════════════════
  async upsertVisitor(event, reqInfo = {}) {
    const existing = await db.one(
      'SELECT id FROM visitors WHERE visitor_id = $1', [event.visitor_id]
    );
    if (!existing) {
      const utm = event.data?.utm || {};
      const device = event.data?.device || {};
      const geo = event.data?.geo || {};
      await db.query(
        `INSERT INTO visitors (project_id, visitor_id, fingerprint, first_utm_source, first_utm_medium,
         first_utm_campaign, first_utm_term, first_utm_content, first_referrer, device_type, device_os, device_browser, device_screen,
         fbclid, fbc, fbp, client_ip, client_user_agent, city, state, country, zip_code, instagram)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
         ON CONFLICT (visitor_id) DO NOTHING`,
        [
          event.project_id || 1, event.visitor_id, event.fingerprint,
          utm.source, utm.medium, utm.campaign, utm.term, utm.content, event.data?.referrer,
          device.type, device.os, device.browser, device.screen,
          utm.fbclid || null, event.data?.fbc || null, event.data?.fbp || null,
          reqInfo.ip || null, reqInfo.userAgent || null,
          geo.city || null, geo.state || null, geo.country || null, geo.zip_code || null,
          event.data?.instagram || null
        ]
      );
    } else {
      await db.query(
        `UPDATE visitors SET last_seen = NOW(), updated_at = NOW(),
         client_ip = COALESCE($2, client_ip),
         client_user_agent = COALESCE($3, client_user_agent)
         WHERE visitor_id = $1`,
        [event.visitor_id, reqInfo.ip || null, reqInfo.userAgent || null]
      );
    }
  },

  async processPageview(event) {
    const utm = event.data?.utm || {};
    await db.query(
      `INSERT INTO sessions (project_id, session_id, visitor_id, utm_source, utm_medium, utm_campaign,
       utm_term, utm_content, referrer, device_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (session_id) DO UPDATE SET pageviews = sessions.pageviews + 1`,
      [event.project_id || 1, event.session_id, event.visitor_id, utm.source, utm.medium, utm.campaign,
      utm.term, utm.content, event.data?.referrer, event.data?.device?.type]
    );
    const sessionCount = await db.one(
      'SELECT COUNT(DISTINCT session_id) as count FROM sessions WHERE visitor_id = $1',
      [event.visitor_id]
    );
    await db.query(
      `UPDATE visitors SET total_pageviews = total_pageviews + 1, last_seen = NOW(),
       total_visits = $1,
       status = CASE WHEN total_visits > 1 AND status = 'visiting' THEN 'returning' ELSE status END
       WHERE visitor_id = $2`,
      [parseInt(sessionCount?.count || 1), event.visitor_id]
    );
  },

  async processScroll(event) {
    const depth = parseInt(event.data?.depth) || 0;
    await db.query(
      'UPDATE visitors SET max_scroll_depth = GREATEST(max_scroll_depth, $1) WHERE visitor_id = $2',
      [depth, event.visitor_id]
    );
  },

  async processClick(event) {
    if (event.data?.type === 'whatsapp_click' && event.data?.phone) {
      await db.query(
        `UPDATE visitors SET whatsapp_contacted = TRUE, whatsapp_date = COALESCE(whatsapp_date, NOW()),
         phone = COALESCE(phone, $1) WHERE visitor_id = $2`,
        [event.data.phone, event.visitor_id]
      );
    }
    if (event.data?.type === 'phone_click' && event.data?.phone) {
      await db.query(
        'UPDATE visitors SET phone = COALESCE(phone, $1) WHERE visitor_id = $2',
        [event.data.phone.replace(/\D/g, ''), event.visitor_id]
      );
    }
  },

  async processFormSubmit(event) {
    const f = event.data?.fields || {};
    const name = f.nome || f.name || null;
    const email = f.email || null;
    const phone = (f.telefone || f.phone || f.tel || f.whatsapp || f.celular || '').replace(/\D/g, '') || null;
    const empresa = f.empresa || null;
    const instagram = f.instagram || null;

    await db.query(
      `UPDATE visitors SET name=COALESCE($1,name), email=COALESCE($2,email), phone=COALESCE($3,phone),
       empresa=COALESCE($4,empresa), instagram=COALESCE($5,instagram),
       status = CASE WHEN status IN ('visiting','returning') THEN 'identified' ELSE status END,
       updated_at=NOW() WHERE visitor_id=$6`,
      [name, email, phone, empresa, instagram, event.visitor_id]
    );

    // Meta CAPI — Lead event
    const visitor = await db.one('SELECT * FROM visitors WHERE visitor_id=$1', [event.visitor_id]);
    if (visitor && visitor.project_id) {
      const project = await db.oneOrNone('SELECT fb_pixel_id, fb_access_token FROM projects WHERE id=$1', [visitor.project_id]);
      if (project?.fb_pixel_id && project?.fb_access_token) {
        metaService.sendEvent('Lead', visitor, { url: event.url }, project.fb_pixel_id, project.fb_access_token);
      }
    }
  },

  async processIdentify(event) {
    const d = event.data || {};
    await db.query(
      `UPDATE visitors SET name=COALESCE($1,name), email=COALESCE($2,email),
       phone=COALESCE($3,phone), empresa=COALESCE($4,empresa), instagram=COALESCE($5,instagram),
       status = CASE WHEN status IN ('visiting','returning') THEN 'identified' ELSE status END,
       updated_at=NOW() WHERE visitor_id=$6`,
      [d.name, d.email, d.phone?.replace(/\D/g, ''), d.empresa, d.instagram, event.visitor_id]
    );
  },

  async processConversion(event) {
    const d = event.data || {};
    await db.query(
      `INSERT INTO conversions (project_id, visitor_id, source, value, product, payment, data)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [event.project_id || 1, event.visitor_id, d.source, d.value, d.product, d.payment, JSON.stringify(d)]
    );
    const visitor = await db.one('SELECT first_seen FROM visitors WHERE visitor_id=$1', [event.visitor_id]);
    const days = visitor ? Math.ceil((Date.now() - new Date(visitor.first_seen).getTime()) / 86400000) : 0;
    await db.query(
      `UPDATE visitors SET converted=TRUE, conversion_value=$1, conversion_source=$2,
       conversion_date=NOW(), days_to_convert=$3, status='converted', updated_at=NOW()
       WHERE visitor_id=$4`,
      [d.value || 0, d.source, days, event.visitor_id]
    );
    // Meta CAPI — CompleteRegistration
    const full = await db.one('SELECT * FROM visitors WHERE visitor_id=$1', [event.visitor_id]);
    if (full && full.project_id) {
      const project = await db.oneOrNone('SELECT fb_pixel_id, fb_access_token FROM projects WHERE id=$1', [full.project_id]);
      if (project?.fb_pixel_id && project?.fb_access_token) {
        metaService.sendEvent('CompleteRegistration', full, { value: d.value, product: d.product, url: event.url }, project.fb_pixel_id, project.fb_access_token);
      }
    }
  },

  async processPageExit(event) {
    const t = event.data?.time_on_page || 0;
    await db.query('UPDATE visitors SET total_time_seconds=total_time_seconds+$1, updated_at=NOW() WHERE visitor_id=$2', [t, event.visitor_id]);
    if (event.session_id) {
      await db.query('UPDATE sessions SET ended_at=NOW(), duration_seconds=duration_seconds+$1 WHERE session_id=$2', [t, event.session_id]);
    }
  },

  // ═══════════════════════════════════════
  // MATCH — Conversão externa
  // ═══════════════════════════════════════
  async matchConversion({ phone, email, source, value, product, payment, data }) {
    const cleanPhone = phone ? phone.replace(/\D/g, '') : null;
    let visitor = null;
    if (cleanPhone) visitor = await db.one('SELECT visitor_id, first_seen FROM visitors WHERE phone=$1 ORDER BY last_seen DESC LIMIT 1', [cleanPhone]);
    if (!visitor && email) visitor = await db.one('SELECT visitor_id, first_seen FROM visitors WHERE email=$1 ORDER BY last_seen DESC LIMIT 1', [email]);
    if (!visitor && cleanPhone) {
      const wa = await db.one(`SELECT visitor_id FROM whatsapp_messages WHERE phone=$1 AND visitor_id IS NOT NULL ORDER BY created_at DESC LIMIT 1`, [cleanPhone]);
      if (wa) visitor = await db.one('SELECT visitor_id, first_seen FROM visitors WHERE visitor_id=$1', [wa.visitor_id]);
    }
    if (!visitor) return { matched: false, reason: 'Nenhum visitante encontrado' };

    const full = await db.one('SELECT * FROM visitors WHERE visitor_id=$1', [visitor.visitor_id]);
    const pId = full?.project_id || 1;
    const days = Math.ceil((Date.now() - new Date(visitor.first_seen).getTime()) / 86400000);
    await db.query(`INSERT INTO conversions (project_id,visitor_id,source,value,product,payment,data) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [pId, visitor.visitor_id, source, value, product, payment, JSON.stringify(data || {})]);
    await db.query(`UPDATE visitors SET converted=TRUE, conversion_value=$1, conversion_source=$2, conversion_date=NOW(), days_to_convert=$3, status='converted', updated_at=NOW() WHERE visitor_id=$4`,
      [value || 0, source, days, visitor.visitor_id]);
    await db.query(`INSERT INTO events (project_id, visitor_id, event_type, data) VALUES ($1,$2,'conversion',$3)`,
      [pId, visitor.visitor_id, JSON.stringify({ source, value, product, payment, matched: true })]);

    if (full && full.project_id) {
      const project = await db.oneOrNone('SELECT fb_pixel_id, fb_access_token FROM projects WHERE id=$1', [full.project_id]);
      if (project?.fb_pixel_id && project?.fb_access_token) {
        metaService.sendEvent('CompleteRegistration', full, { value, product }, project.fb_pixel_id, project.fb_access_token);
      }
    }

    return { matched: true, visitor_id: visitor.visitor_id, days_to_convert: days };
  },

  // ═══════════════════════════════════════
  // WEBHOOK WHATSAPP
  // ═══════════════════════════════════════
  async processWhatsAppWebhook(payload) {
    const data = payload.data || payload;
    const key = data.key || {};
    const remoteJid = key.remoteJid || '';
    const fromMe = key.fromMe || false;
    const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    if (!phone || phone.length < 8) return { processed: false, reason: 'Número inválido' };

    const pushName = data.pushName || null;
    const message = data.message?.conversation || data.message?.extendedTextMessage?.text || '[mídia]';

    await db.query(`INSERT INTO whatsapp_messages (phone,push_name,message,from_me,raw_data) VALUES ($1,$2,$3,$4,$5)`,
      [phone, pushName, message, fromMe, JSON.stringify(payload)]);

    let visitor = await db.one('SELECT visitor_id FROM visitors WHERE phone=$1 ORDER BY last_seen DESC LIMIT 1', [phone]);
    if (!visitor) {
      const click = await db.one(`SELECT visitor_id FROM events WHERE event_type='click' AND data->>'phone'=$1 ORDER BY created_at DESC LIMIT 1`, [phone]);
      if (click) visitor = click;
    }

    if (visitor) {
      await db.query('UPDATE whatsapp_messages SET visitor_id=$1, matched=TRUE WHERE phone=$2 AND visitor_id IS NULL', [visitor.visitor_id, phone]);
      await db.query(`UPDATE visitors SET whatsapp_contacted=TRUE, whatsapp_date=COALESCE(whatsapp_date,NOW()), name=COALESCE(name,$1), phone=COALESCE(phone,$2), updated_at=NOW() WHERE visitor_id=$3`,
        [pushName, phone, visitor.visitor_id]);
      await db.query(`INSERT INTO events (visitor_id,event_type,data) VALUES ($1,'whatsapp_contact',$2)`,
        [visitor.visitor_id, JSON.stringify({ phone, pushName, message: message.substring(0, 200), fromMe })]);
      return { processed: true, matched: true, visitor_id: visitor.visitor_id };
    }
    return { processed: true, matched: false, phone };
  },

  // ═══════════════════════════════════════
  // DASHBOARD — Stats com filtro de data
  // ═══════════════════════════════════════
  async getRealtimeVisitors({ projectId } = {}) {
    let where = `WHERE last_seen > NOW() - INTERVAL '5 minutes'`;
    let params = [];
    if (projectId && projectId !== 'all') {
      params.push(projectId);
      where += ` AND project_id = $1`;
    }
    const result = await db.one(`SELECT COUNT(*) as count FROM visitors ${where}`, params);
    return parseInt(result.count);
  },

  async getStats({ dateFrom, dateTo, projectId } = {}) {
    let where = '';
    const params = [];
    if (projectId && projectId !== 'all') { params.push(projectId); where += ` AND project_id = $${params.length}`; }
    if (dateFrom) { params.push(dateFrom); where += ` AND first_seen::date >= $${params.length}`; }
    if (dateTo) { params.push(dateTo); where += ` AND first_seen::date <= $${params.length}`; }

    const stats = await db.one(`
      SELECT
        COUNT(*) as total_visitors,
        COUNT(*) FILTER (WHERE last_seen > NOW() - INTERVAL '7 days') as active_7d,
        COUNT(*) FILTER (WHERE converted = TRUE) as conversions,
        COALESCE(SUM(conversion_value) FILTER (WHERE converted = TRUE), 0) as total_revenue,
        ROUND(AVG(days_to_convert) FILTER (WHERE converted = TRUE), 1) as avg_days_to_convert,
        ROUND(COUNT(*) FILTER (WHERE converted = TRUE)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as conversion_rate,
        COUNT(*) FILTER (WHERE whatsapp_contacted = TRUE) as whatsapp_contacts,
        COUNT(*) FILTER (WHERE status = 'identified') as identified_leads,
        COUNT(*) FILTER (WHERE instagram IS NOT NULL AND instagram != '') as instagram_leads,
        COUNT(*) FILTER (WHERE fbclid IS NOT NULL OR fbc IS NOT NULL) as meta_leads
      FROM visitors WHERE 1=1 ${where}
    `, params);
    return stats;
  },

  // ═══════════════════════════════════════
  // DASHBOARD — Gráficos com generate_series
  // ═══════════════════════════════════════
  async getChartData({ dateFrom, dateTo, projectId } = {}) {
    const from = dateFrom || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const to = dateTo || new Date().toISOString().split('T')[0];
    const pidOpt = (projectId && projectId !== 'all') ? ` AND project_id = ${parseInt(projectId)}` : '';

    // Série temporal com generate_series + LEFT JOIN (sem subqueries correlacionadas)
    const daily = await db.many(`
      WITH days AS (
        SELECT d::date as day FROM generate_series($1::date, $2::date, '1 day') d
      ),
      daily_visitors AS (
        SELECT first_seen::date as day, COUNT(*) as cnt
        FROM visitors WHERE first_seen::date >= $1::date AND first_seen::date <= $2::date ${pidOpt}
        GROUP BY 1
      ),
      daily_views AS (
        SELECT created_at::date as day, COUNT(*) as cnt
        FROM events WHERE event_type='pageview' AND created_at::date >= $1::date AND created_at::date <= $2::date ${pidOpt}
        GROUP BY 1
      ),
      daily_conversions AS (
        SELECT conversion_date::date as day, COUNT(*) as cnt
        FROM visitors WHERE converted=TRUE AND conversion_date::date >= $1::date AND conversion_date::date <= $2::date ${pidOpt}
        GROUP BY 1
      )
      SELECT d.day,
        COALESCE(v.cnt, 0) as visitors,
        COALESCE(p.cnt, 0) as pageviews,
        COALESCE(c.cnt, 0) as conversions
      FROM days d
      LEFT JOIN daily_visitors v ON v.day = d.day
      LEFT JOIN daily_views p ON p.day = d.day
      LEFT JOIN daily_conversions c ON c.day = d.day
      ORDER BY d.day
    `, [from, to]);

    // Funil
    const funnel = await db.one(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE total_pageviews > 1) as engaged,
        COUNT(*) FILTER (WHERE status IN ('identified','converted')) as identified,
        COUNT(*) FILTER (WHERE whatsapp_contacted = TRUE) as whatsapp,
        COUNT(*) FILTER (WHERE converted = TRUE) as converted
      FROM visitors
      WHERE first_seen::date >= $1::date AND first_seen::date <= $2::date ${pidOpt}
    `, [from, to]);

    // Dispositivos
    const devices = await db.many(`
      SELECT COALESCE(device_type, 'unknown') as device, COUNT(*) as count
      FROM visitors WHERE first_seen::date >= $1::date AND first_seen::date <= $2::date ${pidOpt}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 5
    `, [from, to]);

    // Origens
    const sources = await db.many(`
      SELECT COALESCE(first_utm_source, 'direto') as source, COUNT(*) as visitors,
        COUNT(*) FILTER (WHERE converted=TRUE) as conversions,
        COALESCE(SUM(conversion_value) FILTER (WHERE converted=TRUE), 0) as revenue
      FROM visitors WHERE first_seen::date >= $1::date AND first_seen::date <= $2::date ${pidOpt}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 10
    `, [from, to]);

    // Cidades
    const cities = await db.many(`
      SELECT COALESCE(city, 'Não identificado') as city, COUNT(*) as count
      FROM visitors WHERE first_seen::date >= $1::date AND first_seen::date <= $2::date ${pidOpt}
        AND city IS NOT NULL AND city != ''
      GROUP BY 1 ORDER BY 2 DESC LIMIT 10
    `, [from, to]);

    // Estados
    const states = await db.many(`
      SELECT COALESCE(state, 'Não identificado') as state, COUNT(*) as count
      FROM visitors WHERE first_seen::date >= $1::date AND first_seen::date <= $2::date ${pidOpt}
        AND state IS NOT NULL AND state != ''
      GROUP BY 1 ORDER BY 2 DESC LIMIT 10
    `, [from, to]);

    // Campanhas
    const campaigns = await db.many(`
      SELECT COALESCE(first_utm_campaign, first_utm_source, 'Desconhecida') as campaign, COUNT(*) as visitors,
        COUNT(*) FILTER (WHERE converted=TRUE) as conversions,
        COALESCE(SUM(conversion_value) FILTER (WHERE converted=TRUE), 0) as revenue
      FROM visitors WHERE first_seen::date >= $1::date AND first_seen::date <= $2::date ${pidOpt}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 15
    `, [from, to]);

    return { daily, funnel, devices, sources, cities, states, campaigns };
  },

  // ═══════════════════════════════════════
  // DASHBOARD — Leads com filtros
  // ═══════════════════════════════════════
  async getLeads({ page = 1, limit = 50, status, search, sort = 'last_seen', order = 'DESC', dateFrom, dateTo, projectId }) {
    const offset = (page - 1) * limit;
    let where = [];
    let params = [];
    let i = 1;

    if (projectId && projectId !== 'all') { where.push(`project_id = $${i++}`); params.push(projectId); }
    if (status && status !== 'all') { where.push(`status = $${i++}`); params.push(status); }
    if (search) {
      where.push(`(name ILIKE $${i} OR email ILIKE $${i} OR phone ILIKE $${i} OR empresa ILIKE $${i} OR instagram ILIKE $${i})`);
      params.push(`%${search}%`); i++;
    }
    if (dateFrom) { where.push(`first_seen::date >= $${i++}`); params.push(dateFrom); }
    if (dateTo) { where.push(`first_seen::date <= $${i++}`); params.push(dateTo); }

    const wc = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const allowed = ['last_seen', 'first_seen', 'total_visits', 'total_pageviews', 'conversion_value'];
    const s = allowed.includes(sort) ? sort : 'last_seen';
    const o = order === 'ASC' ? 'ASC' : 'DESC';

    const leads = await db.many(`
      SELECT *,
      (
        COALESCE(total_visits, 0) * 10 
        + COALESCE(total_pageviews, 0) * 5 
        + COALESCE(max_scroll_depth, 0) / 2
        + CASE WHEN whatsapp_contacted THEN 50 ELSE 0 END
        + CASE WHEN converted THEN 100 ELSE 0 END
      ) as score
      FROM visitors ${wc} ORDER BY ${s} ${o} LIMIT $${i++} OFFSET $${i++}
    `, [...params, limit, offset]);

    // Process lead temperatures
    const processedLeads = leads.map(l => {
      let temp = 'cold';
      if (l.score >= 80 || l.converted || l.whatsapp_contacted) temp = 'hot';
      else if (l.score >= 40) temp = 'warm';
      return { ...l, temperature: temp };
    });

    const total = await db.one(`SELECT COUNT(*) as count FROM visitors ${wc}`, params);
    return { leads: processedLeads, total: parseInt(total.count), page, limit };
  },

  async getLeadJourney(visitorId) {
    const visitor = await db.one('SELECT * FROM visitors WHERE visitor_id=$1', [visitorId]);
    if (!visitor) return null;
    const events = await db.many('SELECT * FROM events WHERE visitor_id=$1 ORDER BY created_at ASC', [visitorId]);
    const sessions = await db.many('SELECT * FROM sessions WHERE visitor_id=$1 ORDER BY started_at ASC', [visitorId]);
    const conversions = await db.many('SELECT * FROM conversions WHERE visitor_id=$1 ORDER BY created_at ASC', [visitorId]);
    const whatsappMessages = await db.many('SELECT * FROM whatsapp_messages WHERE visitor_id=$1 ORDER BY created_at ASC', [visitorId]);
    return { visitor, events, sessions, conversions, whatsappMessages };
  },

  // ═══════════════════════════════════════
  // EDITAR LEAD
  // ═══════════════════════════════════════
  async updateLead(visitorId, data) {
    const existing = await db.one('SELECT id FROM visitors WHERE visitor_id=$1', [visitorId]);
    if (!existing) return null;

    const allowed = ['name', 'email', 'phone', 'empresa', 'instagram', 'status', 'city', 'state'];
    const sets = [];
    const params = [];
    let i = 1;

    for (const [key, val] of Object.entries(data)) {
      if (allowed.includes(key)) {
        sets.push(`${key} = $${i++}`);
        params.push(val || null);
      }
    }

    if (sets.length === 0) return existing;

    sets.push(`updated_at = NOW()`);
    params.push(visitorId);

    await db.query(
      `UPDATE visitors SET ${sets.join(', ')} WHERE visitor_id = $${i}`,
      params
    );

    return db.one('SELECT * FROM visitors WHERE visitor_id=$1', [visitorId]);
  },

  // ═══════════════════════════════════════
  // EXCLUIR UM LEAD (e todos os dados dele)
  // ═══════════════════════════════════════
  async deleteLead(visitorId) {
    const existing = await db.one('SELECT id, name, visitor_id FROM visitors WHERE visitor_id=$1', [visitorId]);
    if (!existing) return null;

    await db.query('DELETE FROM events WHERE visitor_id=$1', [visitorId]);
    await db.query('DELETE FROM sessions WHERE visitor_id=$1', [visitorId]);
    await db.query('DELETE FROM conversions WHERE visitor_id=$1', [visitorId]);
    await db.query('DELETE FROM whatsapp_messages WHERE visitor_id=$1', [visitorId]);
    await db.query('DELETE FROM visitors WHERE visitor_id=$1', [visitorId]);

    return { visitor_id: visitorId, name: existing.name };
  },

  // ═══════════════════════════════════════
  // EXCLUIR TODOS OS LEADS (reset total)
  // ═══════════════════════════════════════
  async deleteAllLeads() {
    const count = await db.one('SELECT COUNT(*) as total FROM visitors');

    await db.query('DELETE FROM events');
    await db.query('DELETE FROM sessions');
    await db.query('DELETE FROM conversions');
    await db.query('DELETE FROM whatsapp_messages');
    await db.query('DELETE FROM visitors');

    return { deleted: parseInt(count.total) };
  },
};

module.exports = TrackingService;
