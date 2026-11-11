import fs from 'node:fs';
const F='data/store.json'; const db=JSON.parse(fs.readFileSync(F,'utf8'));
let n=0;
for (const m of db.matches) {
  if (!m.preview) continue;
  if (/[A-Za-z]{4,}\s+[A-Za-z]{4,}/.test(m.preview) || m.preview.length > 700) { m.preview=''; n++; }
}
fs.writeFileSync(F, JSON.stringify(db,null,2));
console.log('очищено дефектных:', n);
