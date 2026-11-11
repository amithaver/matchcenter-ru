import fs from 'node:fs';
const db = JSON.parse(fs.readFileSync('data/store.json','utf8'));
const view = await import('../lib/view.mjs');
const m = db.matches.find(x => x.cover && x.status !== 'finished') || db.matches.find(x => x.cover);
const html = view.matchPage(db, m);
console.log('cover img:', html.includes('class="cover"'));
console.log('og:image:', html.includes('og:image'));
console.log('len', html.length);
