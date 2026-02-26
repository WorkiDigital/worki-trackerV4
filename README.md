# Worki Tracker v2.0

Worki Prospect — Lead Journey Tracker v2.0 (Meta CAPI + Dashboard Pro).

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
