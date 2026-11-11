import fs from 'node:fs';
const db = JSON.parse(fs.readFileSync('data/store.json','utf8'));
const view = await import('../lib/view.mjs');
const m = db.matches.find(x => x.cover) || db.matches[0];
const html = view.matchPage(db, m);
console.log('raw templates left:', (html.match(/\$\{/g)||[]).length);
console.log('cover img:', html.includes('class="cover"'));
console.log('kicker ok:', /class="kicker">[^<$]{3,}/.test(html));
