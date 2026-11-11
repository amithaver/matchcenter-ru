import fs from 'node:fs';
const db=JSON.parse(fs.readFileSync('data/store.json','utf8'));
console.log('лиг', db.leagues.length, 'команд', db.teams.length, 'матчей', db.matches.length);
console.log('первые лиги:', db.leagues.slice(0,5).map(l=>l.slug).join(', '));
console.log('liverpool?', db.teams.some(t=>t.slug==='liverpool'), '| eng команды:', db.teams.filter(t=>/liverpul|liverpool/.test(t.slug)).map(t=>t.slug).slice(0,3).join(','));
const m = db.matches.find(x=>x.league && x.slug.includes('liver'));
console.log('матч-пример:', m && m.slug, '| лига:', m && m.league);
