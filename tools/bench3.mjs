import fs from 'node:fs';
const db = JSON.parse(fs.readFileSync('data/store.json','utf8'));
const view = await import('../lib/view.mjs');
const ms = db.matches.slice(0, 10);
for (const m of ms) view.matchPage(db, m);
console.log('ok');
