import fs from 'node:fs';
const F='data/store.json'; const db=JSON.parse(fs.readFileSync(F,'utf8'));
const cutoff = Date.now() - 60*86400000;
const before = db.matches.length;
db.matches = db.matches.filter(m => new Date(m.date).getTime() >= cutoff);
const used = new Set(); db.matches.forEach(m=>{used.add(m.home);used.add(m.away);});
db.teams = db.teams.filter(t=>used.has(t.slug));
fs.writeFileSync(F, JSON.stringify(db,null,2));
console.log('матчей', before, '->', db.matches.length, '| команд ->', db.teams.length, '| размер МБ', (fs.statSync(F).size/1048576).toFixed(1));
