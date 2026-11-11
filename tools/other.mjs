import fs from 'node:fs';
const db = JSON.parse(fs.readFileSync('data/store.json','utf8'));
const other = db.leagues.filter(l => l.country === 'other');
for (const l of other) console.log(l.slug + ' | ' + l.name);
console.log('всего other:', other.length);
