require('dotenv').config({ path: __dirname + '/.env' });
const db = require('./src/db');

async function debug() {
    try {
        const w = await db.query("SELECT visitor_id, phone, matched, created_at FROM whatsapp_messages ORDER BY created_at DESC LIMIT 5");
        console.log(JSON.stringify(w.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

debug();
