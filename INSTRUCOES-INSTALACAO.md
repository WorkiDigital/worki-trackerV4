# 📋 Instruções de Instalação - Worki Tracker v2.1

## 🎯 Onde colocar os scripts

```html
<!DOCTYPE html>
<html>
<head>
  
  <!-- 1️⃣ META PIXEL - Cole PRIMEIRO -->
  <script>
  !function(f,b,e,v,n,t,s){...}
  fbq('init', '990028642721674');
  fbq('track', 'PageView');
  </script>
  
  <!-- 2️⃣ WORKI TRACKER - Cole DEPOIS -->
  <script>
  (function(){ 
    'use strict'; 
    const CONFIG = { 
      endpoint: 'https://tracker.workidigital.tech/api/track/events',
      ...
    };
  })();
  </script>
  
</head>
<body>
  <!-- Seu conteúdo aqui -->
</body>
</html>
```

---

## 📦 Scripts Necessários

### 1️⃣ Meta Pixel (Facebook Pixel)
**Onde:** Dentro do `<head>`, ANTES do Worki Tracker  
**Arquivo:** `tracking-scripts.html` (linhas 10-23)

```html
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '990028642721674');
fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none" 
       src="https://www.facebook.com/tr?id=990028642721674&ev=PageView&noscript=1"/>
</noscript>
```

---

### 2️⃣ Worki Tracker (Tracking + Geolocalização)
**Onde:** Dentro do `<head>`, DEPOIS do Meta Pixel  
**Arquivo:** `tracking-scripts.html` (linhas 30-350)

Este é o script grande que você já tem. Cole ele completo.

---

## 🎁 OPCIONAL: Conversão Manual

### Para Página de Obrigado/Confirmação
**Onde:** Dentro do `<body>`, no final da página de obrigado  
**Arquivo:** `tracking-scripts.html` (linhas 380-400)

```html
<script>
// Dispara conversão manual
if(window.WorkiTracker){
  WorkiTracker.convert({
    source: 'landing_page',
    value: 997.00,
    product: 'Curso XYZ',
    payment: 'pix'
  });
}

// Também envia para Meta Pixel
if(window.fbq){
  fbq('track', 'Purchase', {
    value: 997.00,
    currency: 'BRL',
    content_name: 'Curso XYZ'
  });
}
</script>
```

---

## ✅ Checklist de Instalação

- [ ] Copiei o **Meta Pixel** para o `<head>` da página
- [ ] Copiei o **Worki Tracker** para o `<head>` (depois do Meta Pixel)
- [ ] Testei abrindo a página no navegador
- [ ] Verifiquei no console do navegador (F12) se não há erros
- [ ] (Opcional) Adicionei script de conversão na página de obrigado

---

## 🧪 Como Testar

1. **Abra sua landing page no navegador**
2. **Abra o Console (F12 → Console)**
3. **Procure por:**
   - `[Worki] Tracker v2.1 iniciado | VID: wk_...`
   - `[Worki] Geo: {city: "...", state: "...", ...}`
   - `[Worki] pageview {...}`

4. **Verifique no Dashboard:**
   - Acesse: `http://localhost:3001/dashboard/`
   - API Key: `19941234`
   - Vá na aba "Leads"
   - Você deve ver seu visitante com cidade e estado preenchidos

---

## 🔧 Configurações Avançadas

### Ativar Debug Mode
No script Worki Tracker, mude:
```javascript
const CONFIG = { 
  endpoint: 'https://tracker.workidigital.tech/api/track/events', 
  batchInterval: 5000, 
  scrollThresholds: [25, 50, 75, 90, 100], 
  debug: true  // ← Mude para true
}; 
```

### Identificar Usuário Manualmente
```javascript
WorkiTracker.identify({
  name: 'João Silva',
  email: 'joao@email.com',
  phone: '11999999999',
  instagram: 'joaosilva',
  empresa: 'Empresa XYZ'
});
```

---

## 📊 O Que Cada Script Faz

### Meta Pixel (Frontend)
- ✅ Envia eventos direto para Facebook
- ✅ Cria cookies _fbc e _fbp
- ✅ Tracking rápido do lado do cliente
- ❌ Pode ser bloqueado por ad-blockers

### Worki Tracker (Frontend → Backend)
- ✅ Coleta geolocalização via IP
- ✅ Tracking de scroll, cliques, formulários
- ✅ Envia para seu backend
- ✅ Backend envia via CAPI para Facebook (não bloqueável)

### Meta CAPI (Backend)
- ✅ Recebe eventos do Worki Tracker
- ✅ Envia para Facebook via servidor
- ✅ Não pode ser bloqueado
- ✅ Deduplica eventos automaticamente

---

## 🆘 Problemas Comuns

### Geolocalização não aparece
- Verifique se o script está carregando: `[Worki] Geo: {...}`
- APIs de geolocalização podem estar bloqueadas
- Teste em modo anônimo/privado

### Eventos não aparecem no Dashboard
- Verifique se o endpoint está correto: `https://tracker.workidigital.tech/api/track/events`
- Verifique no console se há erros de CORS
- Confirme que o backend está rodando

### Meta CAPI não está enviando
- Verifique os logs do servidor: `✅ Meta CAPI: PageView enviado`
- Confirme que `FB_ACCESS_TOKEN` está configurado no `.env`
- Teste fazendo um evento (preencher formulário)

---

## 📞 Suporte

Dúvidas? Verifique os logs:
- **Frontend:** Console do navegador (F12)
- **Backend:** Terminal onde o servidor está rodando

