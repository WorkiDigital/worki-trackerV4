// WORKI TRACKER v5.0 - LOCAL DEBUG VERSION
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','990028642721674');
fbq('track','PageView');

!function(){'use strict';
  
  const C={
    endpoint:'http://localhost:3001/api/track/events', // LOCAL
    batchInterval:5e3,
    scrollThresholds:[25,50,75,90,100],
    debug:true // DEBUG ATIVADO
  };
  
  function g(p){const t=Date.now().toString(36),r=Math.random().toString(36).substring(2,10);return p+'_'+t+'_'+r}
  function gV(){let i=localStorage.getItem('wk_vid');return i||(i=g('wk'),localStorage.setItem('wk_vid',i)),i}
  function gS(){let i=sessionStorage.getItem('wk_sid');return i||(i=g('ws'),sessionStorage.setItem('wk_sid',i)),i}
  function gF(){const f=[navigator.userAgent,navigator.language,screen.width+'x'+screen.height,screen.colorDepth,new Date().getTimezoneOffset(),navigator.hardwareConcurrency||0,navigator.maxTouchPoints||0].join('|');let h=0;for(let i=0;i<f.length;i++){h=((h<<5)-h)+f.charCodeAt(i);h|=0}return'fp_'+Math.abs(h).toString(36)}
  function gU(){const p=new URLSearchParams(window.location.search);return{source:p.get('utm_source')||null,medium:p.get('utm_medium')||null,campaign:p.get('utm_campaign')||null,term:p.get('utm_term')||null,content:p.get('utm_content')||null,fbclid:p.get('fbclid')||null}}
  function gC(n){const m=document.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)'));return m?decodeURIComponent(m[1]):null}
  function gD(){const u=navigator.userAgent;let t='desktop';if(/Mobi|Android/i.test(u))t='mobile';else if(/Tablet|iPad/i.test(u))t='tablet';let o='unknown';if(/Windows/i.test(u))o='Windows';else if(/Mac/i.test(u))o='macOS';else if(/Linux/i.test(u))o='Linux';else if(/Android/i.test(u))o='Android';else if(/iPhone|iPad/i.test(u))o='iOS';let b='unknown';if(/Chrome/i.test(u)&&!/Edge/i.test(u))b='Chrome';else if(/Safari/i.test(u)&&!/Chrome/i.test(u))b='Safari';else if(/Firefox/i.test(u))b='Firefox';else if(/Edge/i.test(u))b='Edge';return{type:t,os:o,browser:b,screen:screen.width+'x'+screen.height}}
  
  let geoData={city:null,state:null,country:null,zip_code:null};
  
  function fG(){
    console.log('[Worki v5.0] 📍 Buscando geolocalização...');
    return fetch('https://ip-api.com/json/?fields=city,regionName,country,zip&lang=pt-BR')
      .then(r=>r.json())
      .then(d=>{
        geoData.city=d.city||null;
        geoData.state=d.regionName||null;
        geoData.country=d.country||null;
        geoData.zip_code=d.zip||null;
        console.log('[Worki v5.0] ✅ Geo obtida:',geoData);
      })
      .catch(()=>{
        console.log('[Worki v5.0] ⚠️ Falha na API principal, tentando fallback...');
        return fetch('https://ipapi.co/json/')
          .then(r=>r.json())
          .then(d=>{
            geoData.city=d.city||null;
            geoData.state=d.region||null;
            geoData.country=d.country_name||null;
            geoData.zip_code=d.postal||null;
            console.log('[Worki v5.0] ✅ Geo obtida (fallback):',geoData);
          })
          .catch(()=>{
            console.error('[Worki v5.0] ❌ Falha ao obter geolocalização');
          });
      });
  }
  
  const VID=gV(),SID=gS(),FP=gF();
  let q=[],sT=Date.now(),sS={};
  
  function pE(e,d={}){
    q.push({visitor_id:VID,session_id:SID,fingerprint:FP,event:e,page:location.pathname,url:location.href,timestamp:new Date().toISOString(),data:d});
    console.log('[Worki v5.0] 📝 Evento adicionado:',e,d);
  }
  
  function fl(){
    if(q.length===0){
      console.log('[Worki v5.0] ⏭️ Fila vazia, nada para enviar');
      return;
    }
    const b=q.splice(0,50);
    console.log('[Worki v5.0] 📤 Enviando',b.length,'evento(s) para',C.endpoint);
    const bl=new Blob([JSON.stringify(b)],{type:'application/json'});
    
    if(navigator.sendBeacon){
      const sent = navigator.sendBeacon(C.endpoint,bl);
      console.log('[Worki v5.0]',sent?'✅ Enviado via sendBeacon':'❌ Falha no sendBeacon');
    }else{
      fetch(C.endpoint,{method:'POST',body:bl,keepalive:!0})
        .then(r=>r.json())
        .then(data=>{
          console.log('[Worki v5.0] ✅ Resposta do servidor:',data);
        })
        .catch(err=>{
          console.error('[Worki v5.0] ❌ Erro ao enviar:',err);
        });
    }
  }
  
  console.log('[Worki v5.0] 🚀 Iniciando tracker...');
  console.log('[Worki v5.0] 👤 Visitor ID:',VID);
  console.log('[Worki v5.0] 🔗 Endpoint:',C.endpoint);
  
  fG().finally(()=>{
    console.log('[Worki v5.0] 📄 Enviando PageView...');
    pE('pageview',{utm:gU(),referrer:document.referrer||null,device:gD(),fbc:gC('_fbc')||null,fbp:gC('_fbp')||null,title:document.title,geo:geoData});
    fl();
  });
  
  function gSP(){const h=document.documentElement,b=document.body,st=window.scrollY||h.scrollTop||b.scrollTop,sh=Math.max(h.scrollHeight,b.scrollHeight)-window.innerHeight;if(sh<=0)return 100;return Math.round((st/sh)*100)}
  let sTi=null;
  window.addEventListener('scroll',()=>{clearTimeout(sTi);sTi=setTimeout(()=>{const p=gSP();C.scrollThresholds.forEach(t=>{if(p>=t&&!sS[t]){sS[t]=!0;pE('scroll',{depth:t+'%'})}})},200)},{passive:!0});
  
  document.addEventListener('click',e=>{const el=e.target.closest('a, button, [data-track]');if(!el)return;const h=el.getAttribute('href')||'',tx=(el.innerText||'').substring(0,100).trim(),tg=el.tagName.toLowerCase();if(h.includes('wa.me')||h.includes('whatsapp')||h.includes('api.whatsapp')){const pM=h.match(/[\d+]{10,}/);pE('click',{type:'whatsapp_click',phone:pM?pM[0]:'',href:h,text:tx});fl();return}if(h.startsWith('tel:')){const ph=h.replace('tel:','').replace(/\D/g,'');pE('click',{type:'phone_click',phone:ph,href:h,text:tx});fl();return}pE('click',{type:'general',tag:tg,text:tx,href:h.substring(0,200),id:el.id||null,classes:el.className?el.className.substring(0,100):null})});
  
  document.addEventListener('submit',e=>{const f=e.target;if(!f||f.tagName!=='FORM')return;const fd={};f.querySelectorAll('input, select, textarea').forEach(i=>{const n=(i.name||i.id||i.placeholder||'').toLowerCase(),v=i.value;if(!n||!v)return;if(i.type==='password'||i.type==='hidden')return;if(n.match(/nome|name|full.?name/i))fd.nome=v;else if(n.match(/email|e-mail|e_mail/i))fd.email=v;else if(n.match(/tel|phone|fone|whats|celular|whatsapp/i))fd.telefone=v;else if(n.match(/empresa|company|loja|negocio/i))fd.empresa=v;else if(n.match(/instagram|insta|ig/i))fd.instagram=v;else fd[n]=v});if(Object.keys(fd).length>0){pE('form_submit',{fields:fd,formId:f.id||null,formAction:f.action||null});fl()}});
  
  function oE(){const t=Math.round((Date.now()-sT)/1e3);pE('page_exit',{time_on_page:t,scroll_depth:gSP()+'%'});fl()}
  window.addEventListener('beforeunload',oE);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')oE()});
  setInterval(fl,C.batchInterval);
  
  window.WorkiTracker={identify:d=>{pE('identify',d);fl()},convert:d=>{pE('conversion',d);fl()}};
  
  console.log('[Worki v5.0] ✅ Tracker iniciado com sucesso!');
}();
