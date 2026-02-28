require('dotenv').config({ path: __dirname + '/.env' });
const db = require('./src/db');

async function debug() {
    try {
        console.log("--- VISITORS ---");
        const visitors = await db.query('SELECT visitor_id, name, email, phone FROM visitors ORDER BY created_at DESC LIMIT 5');
        console.table(visitors.rows || visitors);

        console.log("\\n--- EVENTS (form_submit) ---");
        const events = await db.query("SELECT visitor_id, event_type, data FROM events WHERE event_type = 'form_submit' ORDER BY created_at DESC LIMIT 5");
        console.log(JSON.stringify(events.rows || events, null, 2));

        console.log("\\n--- EVENTS (whatsapp_click) ---");
        const clicks = await db.query("SELECT visitor_id, event_type, data FROM events WHERE event_type = 'click' AND data->>'type' = 'whatsapp_click' ORDER BY created_at DESC LIMIT 5");
        console.log(JSON.stringify(clicks.rows || clicks, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

debug();
