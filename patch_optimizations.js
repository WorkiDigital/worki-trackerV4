const fs = require('fs');

// 1. wk.js
console.log('Patching public/wk.js...');
let wk = fs.readFileSync('public/wk.js', 'utf8');
wk = wk.replace("geoEndpoint: 'https://tracker.workidigital.tech/api/track/geo', ", "");
wk = wk.replace("var geo = { city: null, state: null, country: null, zip_code: null }; function fgeo() { return fetch(C.geoEndpoint).then(function (r) { return r.json() }).then(function (d) { if (d && d.city) { geo.city = d.city; geo.state = d.state; geo.country = d.country; geo.zip_code = d.zip_code } }).catch(function () { }) } ", "");
wk = wk.replace(
    "fgeo().finally(function () { pe('pageview', { utm: utm(), referrer: document.referrer || null, device: dev(), fbc: ck('_fbc') || null, fbp: ck('_fbp') || null, geo: geo, title: document.title }); fl(); if (typeof fbq !== 'undefined') fbq('track', 'PageView') });",
    "pe('pageview', { utm: utm(), referrer: document.referrer || null, device: dev(), fbc: ck('_fbc') || null, fbp: ck('_fbp') || null, title: document.title }); fl(); if (typeof fbq !== 'undefined') fbq('track', 'PageView');"
);
fs.writeFileSync('public/wk.js', wk);

// 2. index.js
console.log('Patching src/index.js...');
let index = fs.readFileSync('src/index.js', 'utf8');
index = index.replace(
    "const trackLimiter = rateLimit({ windowMs: 60 * 1000, max: 50, message: { error: 'Muitas requisições' } });",
    "const trackLimiter = rateLimit({ windowMs: 60 * 1000, max: 300, message: { error: 'Muitas requisições' } });"
);
fs.writeFileSync('src/index.js', index);

// 3. routes/track.js
console.log('Patching src/routes/track.js...');
let trackRt = fs.readFileSync('src/routes/track.js', 'utf8');
// remove geo route completely
const geoRouteStart = trackRt.indexOf("// Geo proxy");
if (geoRouteStart > -1) {
    const geoRouteEnd = trackRt.lastIndexOf("module.exports = router;");
    trackRt = trackRt.substring(0, geoRouteStart) + "\\n" + trackRt.substring(geoRouteEnd);
    fs.writeFileSync('src/routes/track.js', trackRt);
}

// 4. services/tracking.js
console.log('Patching src/services/tracking.js...');
let tracking = fs.readFileSync('src/services/tracking.js', 'utf8');

const geoResolvedMethod = `  async resolveGeo(visitorId, ip) {
    try {
      if (ip === '127.0.0.1' || ip === '::1') return;
      const response = await fetch(\`http://ip-api.com/json/\${ip}?fields=status,country,regionName,city,zip&lang=pt-BR\`);
      const data = await response.json();
      if (data.status === 'success' && data.city) {
        await db.query(
          'UPDATE visitors SET city=$1, state=$2, country=$3, zip_code=$4 WHERE visitor_id=$5',
          [data.city, data.regionName, data.country, data.zip, visitorId]
        );
        console.log(\`[GEO] Background IP Res: \${ip} -> \${data.city}/\${data.regionName} para \${visitorId}\`);
      }
    } catch (err) {}
  },

  async upsertVisitor(event, reqInfo = {}) {`;

tracking = tracking.replace("  async upsertVisitor(event, reqInfo = {}) {", geoResolvedMethod);

const oldUpsertBody = `    const existing = await db.one(
      'SELECT id FROM visitors WHERE visitor_id = $1', [event.visitor_id]
    );
    if (!existing) {
      const utm = event.data?.utm || {};
      const device = event.data?.device || {};
      const geo = event.data?.geo || {};
      await db.query(
        \`INSERT INTO visitors (project_id, visitor_id, fingerprint, first_utm_source, first_utm_medium,
         first_utm_campaign, first_utm_term, first_utm_content, first_referrer, device_type, device_os, device_browser, device_screen,
         fbclid, fbc, fbp, client_ip, client_user_agent, city, state, country, zip_code, instagram)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
         ON CONFLICT (visitor_id) DO NOTHING\`,
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
    }`;

const newUpsertBody = `    const existing = await db.one(
      'SELECT id, city FROM visitors WHERE visitor_id = $1', [event.visitor_id]
    );
    
    if (reqInfo.ip && (!existing || !existing.city)) {
      this.resolveGeo(event.visitor_id, reqInfo.ip).catch(() => {});
    }

    if (!existing) {
      const utm = event.data?.utm || {};
      const device = event.data?.device || {};
      await db.query(
        \`INSERT INTO visitors (project_id, visitor_id, fingerprint, first_utm_source, first_utm_medium,
         first_utm_campaign, first_utm_term, first_utm_content, first_referrer, device_type, device_os, device_browser, device_screen,
         fbclid, fbc, fbp, client_ip, client_user_agent, instagram)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT (visitor_id) DO NOTHING\`,
        [
          event.project_id || 1, event.visitor_id, event.fingerprint,
          utm.source, utm.medium, utm.campaign, utm.term, utm.content, event.data?.referrer,
          device.type, device.os, device.browser, device.screen,
          utm.fbclid || null, event.data?.fbc || null, event.data?.fbp || null,
          reqInfo.ip || null, reqInfo.userAgent || null,
          event.data?.instagram || null
        ]
      );
    }`;

tracking = tracking.replace(oldUpsertBody, newUpsertBody);
fs.writeFileSync('src/services/tracking.js', tracking);
console.log('All files patched successfully.');
