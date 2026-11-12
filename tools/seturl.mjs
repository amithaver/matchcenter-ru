import fs from 'node:fs';
const F='data/store.json'; const db=JSON.parse(fs.readFileSync(F,'utf8'));
db.settings.siteUrl='https://live-football-static.onrender.com';
fs.writeFileSync(F, JSON.stringify(db,null,2));
console.log('siteUrl ->', db.settings.siteUrl);
