# Worki Tracker v5.0

Worki Prospect — Lead Journey Tracker v5.0 (Meta CAPI + Dashboard Pro).

## Overview
This platform tracks user journeys, captures leads from various sources (Forms, WhatsApp, Meta Ads), and provides a comprehensive dashboard for conversion analysis.

## Features
- **Lead Journey Tracking**: Monitor first-seen, UTM parameters, and referral sources.
- **Multi-Source Attribution**: Support for Meta Ads (FBCLID, FBC, FBP) and Instagram.
- **WhatsApp Integration**: Match incoming WhatsApp messages with existing visitors.
- **Conversion Tracking**: Record products, payment methods, and order values.
- **Geographic Data**: Capture IP, city, state, and country information.

## Database Setup
The project uses PostgreSQL with Supabase.
1. Configure your `DATABASE_URL` in `.env`.
2. Run the migration script:
   ```bash
   npm run migrate
   ```

## Development
```bash
npm install
npm run dev
```

## Production
```bash
npm start
```

### 🚀 Deploy automático com GitHub Actions
O repositório já inclui um workflow (`.github/workflows/docker-deploy.yml`) que:

1. Executa em pushes para a branch `main` (ou `principal`).
2. Constrói a imagem Docker com a `Dockerfile` presente.
3. Faz push para um registro configurado via segredos.

**Para habilitar:**

- No GitHub vá em *Settings → Secrets and variables → Actions*.
- Crie os seguintes valores:
  - `DOCKER_REGISTRY` (ex: `docker.io` ou `ghcr.io`)
  - `DOCKER_USERNAME` / `DOCKER_PASSWORD`
  - `IMAGE_NAME` (ex: `workidigital/worki-trackerV4`)

Após o primeiro push a imagem será publicada automaticamente e poderá ser usada
em qualquer ambiente de produção.

---
