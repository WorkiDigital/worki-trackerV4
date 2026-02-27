// ═══════════════════════════════════════════════════════════════════════════
// WORKI TRACKER v2.5 COMPLETE - Meta Pixel Web + Server-Side CAPI
// COM TODOS OS PARÂMETROS POSSÍVEIS PARA META
// ═══════════════════════════════════════════════════════════════════════════

!function(f,b,e,v,n,t,s){
  if(f.fbq)return;
  n=f.fbq=function(){
    n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)
  };
  if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
  t=b.createElement(e);t.async=!0;
  t.src=v;
  s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)
}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

// Inicializar Meta Pixel
fbq('init','990028642721674');
fbq('track','PageView');

// ═══════════════════════════════════════════════════════════════════════════
// WORKI TRACKER v2.5 COMPLETE
// ═══════════════════════════════════════════════════════════════════════════
!function(){'use strict';
  
  const CONFIG = {
    endpoint: 'https://tracker.workidigital.tech/api/track/events',
    batchInterval: 5000,
    scrollThresholds: [25, 50, 75, 90, 100],
    debug: false
  };
  
  // ═══ IDENTIFICAÇÃO ÚNICA ═══
  function generateId(prefix){
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).substring(2,10);
    return prefix + '_' + ts + '_' + rnd;
  }
  
  function getVisitorId(){
    let id = localStorage.getItem('wk_vid');
    if(!id){
      id = generateId('wk');
      localStorage.setItem('wk_vid', id);
    }
    return id;
  }
  
  function getSessionId(){
    let id = sessionStorage.getItem('wk_sid');
    if(!id){
      id = generateId('ws');
      sessionStorage.setItem('wk_sid', id);
    }
    return id;
  }
  
  // ═══ FINGERPRINT AVANÇADO ═══
  function getFingerprint(){
    const fp = [
      navigator.userAgent,
      navigator.language,
      navigator.languages ? navigator.languages.join(',') : '',
      screen.width+'x'+screen.height,
      screen.colorDepth,
      screen.pixelDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.maxTouchPoints || 0,
      navigator.platform,
      navigator.vendor,
      navigator.deviceMemory || 0,
      navigator.connection ? navigator.connection.effectiveType : '',
      window.devicePixelRatio || 1
    ].join('|');
    
    let hash = 0;
    for(let i = 0; i < fp.length; i++){
      hash = ((hash << 5) - hash) + fp.charCodeAt(i);
      hash |= 0;
    }
    return 'fp_' + Math.abs(hash).toString(36);
  }
  
  // ═══ UTM PARAMETERS COMPLETOS ═══
  function getUTM(){
    const p = new URLSearchParams(window.location.search);
    return {
      source: p.get('utm_source') || null,
      medium: p.get('utm_medium') || null,
      campaign: p.get('utm_campaign') || null,
      term: p.get('utm_term') || null,
      content: p.get('utm_content') || null,
      id: p.get('utm_id') || null,
      source_platform: p.get('utm_source_platform') || null,
      creative_format: p.get('utm_creative_format') || null,
      marketing_tactic: p.get('utm_marketing_tactic') || null,
      fbclid: p.get('fbclid') || null,
      gclid: p.get('gclid') || null,
      msclkid: p.get('msclkid') || null,
      ttclid: p.get('ttclid') || null
    };
  }
  
  // ═══ TODOS OS COOKIES META ═══
  function getCookie(name){
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  
  function getAllMetaCookies(){
    return {
      fbc: getCookie('_fbc') || null,
      fbp: getCookie('_fbp') || null,
      fbclid: getCookie('_fbclid') || null,
      ga: getCookie('_ga') || null,
      gid: getCookie('_gid') || null
    };
  }
  
  // ═══ DEVICE INFO COMPLETO ═══
  function getDevice(){
    const ua = navigator.userAgent;
    let type = 'desktop';
    if(/Mobi|Android/i.test(ua)) type = 'mobile';
    else if(/Tablet|iPad/i.test(ua)) type = 'tablet';
    
    let os = 'unknown';
    let osVersion = '';
    if(/Windows NT 10/i.test(ua)){ os = 'Windows'; osVersion = '10'; }
    else if(/Windows NT 6.3/i.test(ua)){ os = 'Windows'; osVersion = '8.1'; }
    else if(/Windows NT 6.2/i.test(ua)){ os = 'Windows'; osVersion = '8'; }
    else if(/Windows NT 6.1/i.test(ua)){ os = 'Windows'; osVersion = '7'; }
    else if(/Mac OS X (\d+[._]\d+)/i.test(ua)){ 
      os = 'macOS'; 
      const match = ua.match(/Mac OS X (\d+[._]\d+)/i);
      osVersion = match ? match[1].replace('_', '.') : '';
    }
    else if(/Android (\d+\.?\d*)/i.test(ua)){ 
      os = 'Android';
      const match = ua.match(/Android (\d+\.?\d*)/i);
      osVersion = match ? match[1] : '';
    }
    else if(/iPhone OS (\d+[._]\d+)/i.test(ua)){ 
      os = 'iOS';
      const match = ua.match(/iPhone OS (\d+[._]\d+)/i);
      osVersion = match ? match[1].replace('_', '.') : '';
    }
    else if(/iPad.*OS (\d+[._]\d+)/i.test(ua)){ 
      os = 'iOS';
      const match = ua.match(/iPad.*OS (\d+[._]\d+)/i);
      osVersion = match ? match[1].replace('_', '.') : '';
    }
    else if(/Linux/i.test(ua)) os = 'Linux';
    
    let browser = 'unknown';
    let browserVersion = '';
    if(/Chrome\/(\d+)/i.test(ua) && !/Edge/i.test(ua)){ 
      browser = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/i);
      browserVersion = match ? match[1] : '';
    }
    else if(/Safari\/(\d+)/i.test(ua) && !/Chrome/i.test(ua)){ 
      browser = 'Safari';
      const match = ua.match(/Version\/(\d+)/i);
      browserVersion = match ? match[1] : '';
    }
    else if(/Firefox\/(\d+)/i.test(ua)){ 
      browser = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/i);
      browserVersion = match ? match[1] : '';
    }
    else if(/Edge\/(\d+)/i.test(ua)){ 
      browser = 'Edge';
      const match = ua.match(/Edge\/(\d+)/i);
      browserVersion = match ? match[1] : '';
    }
    
    return {
      type: type,
      os: os,
      os_version: osVersion,
      browser: browser,
      browser_version: browserVersion,
      screen_width: screen.width,
      screen_height: screen.height,
      screen_resolution: screen.width+'x'+screen.height,
      color_depth: screen.colorDepth,
      pixel_depth: screen.pixelDepth,
      pixel_ratio: window.devicePixelRatio || 1,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      orientation: screen.orientation ? screen.orientation.type : 'unknown',
      touch_support: navigator.maxTouchPoints > 0,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      languages: navigator.languages ? navigator.languages.join(',') : navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezone_offset: new Date().getTimezoneOffset(),
      hardware_concurrency: navigator.hardwareConcurrency || null,
      device_memory: navigator.deviceMemory || null,
      connection_type: navigator.connection ? navigator.connection.effectiveType : null,
      connection_downlink: navigator.connection ? navigator.connection.downlink : null,
      connection_rtt: navigator.connection ? navigator.connection.rtt : null,
      do_not_track: navigator.doNotTrack || null,
      cookies_enabled: navigator.cookieEnabled,
      java_enabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
      online: navigator.onLine
    };
  }
  
  // ═══ GEOLOCALIZAÇÃO VIA IP (2 APIs) ═══
  let geoData = {
    city: null,
    state: null,
    state_code: null,
    country: null,
    country_code: null,
    zip_code: null,
    latitude: null,
    longitude: null,
    timezone: null,
    isp: null,
    org: null,
    as: null
  };
  
  function fetchGeo(){
    return fetch('https://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as&lang=pt-BR')
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(d.status === 'success'){
          geoData.city = d.city || null;
          geoData.state = d.regionName || null;
          geoData.state_code = d.region || null;
          geoData.country = d.country || null;
          geoData.country_code = d.countryCode || null;
          geoData.zip_code = d.zip || null;
          geoData.latitude = d.lat || null;
          geoData.longitude = d.lon || null;
          geoData.timezone = d.timezone || null;
          geoData.isp = d.isp || null;
          geoData.org = d.org || null;
          geoData.as = d.as || null;
        }
        if(CONFIG.debug) console.log('[Worki v2.5] Geo:', geoData);
      })
      .catch(function(){
        // Fallback: tenta outra API
        return fetch('https://ipapi.co/json/')
          .then(function(r){ return r.json(); })
          .then(function(d){
            geoData.city = d.city || null;
            geoData.state = d.region || null;
            geoData.state_code = d.region_code || null;
            geoData.country = d.country_name || null;
            geoData.country_code = d.country_code || null;
            geoData.zip_code = d.postal || null;
            geoData.latitude = d.latitude || null;
            geoData.longitude = d.longitude || null;
            geoData.timezone = d.timezone || null;
            geoData.isp = d.org || null;
          })
          .catch(function(){});
      });
  }
  
  // ═══ PERFORMANCE METRICS ═══
  function getPerformance(){
    if(!window.performance || !window.performance.timing) return null;
    
    const t = window.performance.timing;
    const now = Date.now();
    
    return {
      dns_time: t.domainLookupEnd - t.domainLookupStart,
      tcp_time: t.connectEnd - t.connectStart,
      request_time: t.responseStart - t.requestStart,
      response_time: t.responseEnd - t.responseStart,
      dom_processing: t.domComplete - t.domLoading,
      dom_interactive: t.domInteractive - t.navigationStart,
      dom_complete: t.domComplete - t.navigationStart,
      load_time: t.loadEventEnd - t.navigationStart,
      page_load_time: now - t.navigationStart,
      redirect_count: window.performance.navigation ? window.performance.navigation.redirectCount : 0
    };
  }
  
  // ═══ FILA DE EVENTOS ═══
  const VID = getVisitorId();
  const SID = getSessionId();
  const FP = getFingerprint();
  let queue = [];
  let startTime = Date.now();
  let scrollSent = {};
  
  function pushEvent(event, data){
    data = data || {};
    queue.push({
      visitor_id: VID,
      session_id: SID,
      fingerprint: FP,
      event: event,
      page: location.pathname,
      url: location.href,
      timestamp: new Date().toISOString(),
      data: data
    });
    if(CONFIG.debug) console.log('[Worki v2.5]', event, data);
  }
  
  function flush(){
    if(queue.length === 0) return;
    
    const batch = queue.splice(0, 50);
    const blob = new Blob([JSON.stringify(batch)], {type:'application/json'});
    
    if(navigator.sendBeacon){
      navigator.sendBeacon(CONFIG.endpoint, blob);
    } else {
      fetch(CONFIG.endpoint, {
        method:'POST',
        body:blob,
        keepalive:true
      }).catch(function(){});
    }
  }
  
  // ═══ PAGEVIEW COM TODOS OS PARÂMETROS ═══
  fetchGeo().finally(function(){
    // Aguardar performance metrics
    if(document.readyState === 'complete'){
      sendPageView();
    } else {
      window.addEventListener('load', sendPageView);
    }
  });
  
  function sendPageView(){
    pushEvent('pageview', {
      // UTM & Campaign
      utm: getUTM(),
      
      // Referrer
      referrer: document.referrer || null,
      referrer_domain: document.referrer ? new URL(document.referrer).hostname : null,
      
      // Device & Browser
      device: getDevice(),
      
      // Meta Cookies
      meta_cookies: getAllMetaCookies(),
      
      // Page Info
      title: document.title,
      url: location.href,
      path: location.pathname,
      hash: location.hash || null,
      search: location.search || null,
      protocol: location.protocol,
      host: location.host,
      hostname: location.hostname,
      port: location.port || null,
      
      // Geolocalização
      geo: geoData,
      
      // Performance
      performance: getPerformance(),
      
      // Timestamps
      client_timestamp: new Date().toISOString(),
      client_unix_timestamp: Math.floor(Date.now() / 1000),
      
      // Session Info
      is_new_session: !sessionStorage.getItem('wk_session_started'),
      session_count: parseInt(localStorage.getItem('wk_session_count') || '0') + 1
    });
    
    // Marcar sessão como iniciada
    if(!sessionStorage.getItem('wk_session_started')){
      sessionStorage.setItem('wk_session_started', 'true');
      const count = parseInt(localStorage.getItem('wk_session_count') || '0') + 1;
      localStorage.setItem('wk_session_count', count.toString());
    }
    
    flush();
  }
  
  // ═══ SCROLL TRACKING ═══
  function getScrollPercent(){
    const h = document.documentElement;
    const b = document.body;
    const st = window.scrollY || h.scrollTop || b.scrollTop;
    const sh = Math.max(h.scrollHeight, b.scrollHeight) - window.innerHeight;
    if(sh <= 0) return 100;
    return Math.round((st / sh) * 100);
  }
  
  let scrollTimer = null;
  window.addEventListener('scroll', function(){
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function(){
      const pct = getScrollPercent();
      CONFIG.scrollThresholds.forEach(function(t){
        if(pct >= t && !scrollSent[t]){
          scrollSent[t] = true;
          pushEvent('scroll', { 
            depth: t + '%',
            depth_pixels: window.scrollY,
            max_scroll: Math.max(h.scrollHeight, b.scrollHeight)
          });
        }
      });
    }, 200);
  }, {passive:true});
  
  // ═══ CLICK TRACKING ═══
  document.addEventListener('click', function(e){
    const el = e.target.closest('a, button, [data-track]');
    if(!el) return;
    
    const href = el.getAttribute('href') || '';
    const text = (el.innerText || '').substring(0, 100).trim();
    const tag = el.tagName.toLowerCase();
    
    // WhatsApp click
    if(href.includes('wa.me') || href.includes('whatsapp') || href.includes('api.whatsapp')){
      const phoneMatch = href.match(/[\d+]{10,}/);
      pushEvent('click', {
        type:'whatsapp_click',
        phone: phoneMatch ? phoneMatch[0] : '',
        href: href,
        text: text,
        element: tag,
        position_x: e.clientX,
        position_y: e.clientY,
        scroll_position: window.scrollY
      });
      flush();
      return;
    }
    
    // Phone click
    if(href.startsWith('tel:')){
      const phone = href.replace('tel:', '').replace(/\D/g, '');
      pushEvent('click', {
        type:'phone_click',
        phone: phone,
        href: href,
        text: text,
        element: tag,
        position_x: e.clientX,
        position_y: e.clientY,
        scroll_position: window.scrollY
      });
      flush();
      return;
    }
    
    // General click
    pushEvent('click', {
      type:'general',
      tag: tag,
      text: text,
      href: href.substring(0, 200),
      id: el.id || null,
      classes: el.className ? el.className.substring(0, 100) : null,
      position_x: e.clientX,
      position_y: e.clientY,
      scroll_position: window.scrollY,
      is_external: href.startsWith('http') && !href.includes(location.hostname)
    });
  });
  
  // ═══ FORM TRACKING ═══
  document.addEventListener('submit', function(e){
    const form = e.target;
    if(!form || form.tagName !== 'FORM') return;
    
    const fields = {};
    var inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(function(inp){
      var name = (inp.name || inp.id || inp.placeholder || '').toLowerCase();
      var val = inp.value;
      if(!name || !val) return;
      if(inp.type === 'password' || inp.type === 'hidden') return;
      
      if(name.match(/nome|name|full.?name/i)) fields.nome = val;
      else if(name.match(/email|e-mail|e_mail/i)) fields.email = val;
      else if(name.match(/tel|phone|fone|whats|celular|whatsapp/i)) fields.telefone = val;
      else if(name.match(/empresa|company|loja|negocio/i)) fields.empresa = val;
      else if(name.match(/instagram|insta|ig/i)) fields.instagram = val;
      else fields[name] = val;
    });
    
    if(Object.keys(fields).length > 0){
      pushEvent('form_submit', {
        fields: fields,
        formId: form.id || null,
        formAction: form.action || null,
        formMethod: form.method || 'get',
        formName: form.name || null,
        field_count: inputs.length
      });
      flush();
    }
  });
  
  // ═══ PAGE EXIT ═══
  function onExit(){
    var timeOnPage = Math.round((Date.now() - startTime) / 1000);
    pushEvent('page_exit', {
      time_on_page: timeOnPage,
      scroll_depth: getScrollPercent() + '%',
      max_scroll_pixels: window.scrollY,
      interactions: queue.length
    });
    flush();
  }
  
  window.addEventListener('beforeunload', onExit);
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'hidden') onExit();
  });
  
  // ═══ BATCH SEND ═══
  setInterval(flush, CONFIG.batchInterval);
  
  // ═══ API PÚBLICA ═══
  window.WorkiTracker = {
    identify: function(data){
      pushEvent('identify', data);
      flush();
    },
    convert: function(data){
      pushEvent('conversion', data);
      flush();
    }
  };
  
  if(CONFIG.debug) console.log('[Worki v2.5 COMPLETE] Tracker iniciado | VID:', VID);
}();
