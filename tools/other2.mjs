import fs from 'node:fs';
const db = JSON.parse(fs.readFileSync('data/store.json','utf8'));
for (const l of db.leagues.filter(l=>l.country==='other')) console.log(l.name);
