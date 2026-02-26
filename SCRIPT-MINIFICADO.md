# 🚀 Script Minificado - Worki Tracker v2.1

## ✨ Versão Ultra Compacta (1 linha)

Cole este código **UMA ÚNICA VEZ** no `<head>` da sua página:

```html
<script src="https://tracker.workidigital.tech/wk.js" async></script>
```

**Pronto!** Esse único script carrega:
- ✅ Meta Pixel (Facebook)
- ✅ Worki Tracker (Geolocalização + Tracking completo)

---

## 📊 O que esse script faz?

### Tracking Automático:
- 📍 Geolocalização via IP (cidade, estado, país)
- 👁️ PageView com todos os parâmetros Meta
- 📜 Scroll tracking (25%, 50%, 75%, 90%, 100%)
- 🖱️ Click tracking (WhatsApp, telefone, links)
- 📝 Form tracking (captura nome, email, telefone, instagram)
- ⏱️ Tempo na página
- 📱 Device info (mobile/desktop, OS, browser)
- 🔗 UTM parameters
- 🍪 Meta cookies (_fbc, _fbp)

### Envio para:
- 📘 Facebook Pixel (frontend)
- 🔄 Meta CAPI (backend - não bloqueável)
- 💾 Seu banco de dados

---

## 🎯 Exemplo Completo

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Minha Landing Page</title>
  
  <!-- ÚNICO SCRIPT NECESSÁRIO -->
  <script src="https://tracker.workidigital.tech/wk.js" async></script>
  
</head>
<body>
  <h1>Bem-vindo!</h1>
  
  <form>
    <input type="text" name="nome" placeholder="Nome" required>
    <input type="email" name="email" placeholder="E-mail" required>
    <input type="tel" name="telefone" placeholder="WhatsApp" required>
    <button type="submit">Enviar</button>
  </form>
  
  <a href="https://wa.me/5511999999999">Falar no WhatsApp</a>
</body>
</html>
```

---

## 🎁 OPCIONAL: Conversão Manual

Para páginas de obrigado/confirmação, adicione:

```html
<script>
// Aguarda o script carregar
setTimeout(function(){
  if(window.WorkiTracker){
    WorkiTracker.convert({
      source: 'landing_page',
      value: 997.00,
      product: 'Curso XYZ',
      payment: 'pix'
    });
  }
  if(window.fbq){
    fbq('track', 'Purchase', {
      value: 997.00,
      currency: 'BRL'
    });
  }
}, 1000);
</script>
```

---

## 🔧 Ativar Debug Mode

Se quiser ver os logs no console do navegador:

1. Abra o arquivo `worki-trackerV4-main/public/wk.js`
2. Procure por `debug:!1`
3. Mude para `debug:!0`
4. Salve e reinicie o servidor

---

## ✅ Vantagens da Versão Minificada

### Antes (2 scripts separados):
- 📄 ~400 linhas de código
- 🐌 Mais lento para carregar
- 👀 Código visível e editável

### Agora (1 script minificado):
- 📄 1 linha no HTML
- ⚡ Carregamento assíncrono
- 🔒 Código ofuscado e protegido
- 🎯 Mais profissional
- 🚀 Mais rápido

---

## 🌐 URLs Importantes

- **Script:** `https://tracker.workidigital.tech/wk.js`
- **Dashboard:** `http://localhost:3001/dashboard/`
- **API Endpoint:** `https://tracker.workidigital.tech/api/track/events`

---

## 🧪 Como Testar

1. Cole o script na sua página
2. Abra a página no navegador
3. Abra o Console (F12)
4. Procure por: `[Worki] Tracker v2.1 iniciado`
5. Acesse o dashboard e veja seu visitante

---

## 📦 Arquivos Criados

- `public/wk.js` - Script minificado (hospedado no seu servidor)
- `tracking-minified.html` - Exemplo de uso
- `SCRIPT-MINIFICADO.md` - Este documento

---

## 🔄 Atualizações

Para atualizar o script:
1. Edite `public/wk.js`
2. Reinicie o servidor: `npm start`
3. Limpe o cache do navegador (Ctrl+Shift+R)

---

## 💡 Dica Pro

Adicione versionamento na URL para forçar atualização:

```html
<script src="https://tracker.workidigital.tech/wk.js?v=2.1" async></script>
```

Quando atualizar, mude para `?v=2.2`, `?v=2.3`, etc.

