import fs from 'node:fs';
const db=JSON.parse(fs.readFileSync('data/store.json','utf8'));
for (const m of db.matches) if (m.cover) { delete m.cover; }
fs.writeFileSync('data/store.json', JSON.stringify(db,null,2));
console.log('обложки сброшены');
