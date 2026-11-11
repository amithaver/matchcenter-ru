import fs from 'node:fs';
import { translit, slugify } from '../lib/translit.mjs';
const F='data/store.json'; const db=JSON.parse(fs.readFileSync(F,'utf8'));
let changed=0; const map=new Map();
for (const t of db.teams) {
  const name = translit(t.original || t.name);
  const slug = slugify(name);
  if (!slug) continue;
  if (t.slug !== slug) { map.set(t.slug, slug); changed++; }
  t.name = name; t.slug = slug;
}
for (const m of db.matches) {
  const h = map.get(m.home) || m.home, a = map.get(m.away) || m.away;
  m.home = h; m.away = a;
  m.slug = `${h}-${a}-${String(m.date).slice(0,10)}`;
}
console.log('переименовано команд:', changed, '| примеры:', db.teams.slice(0,6).map(t=>t.name).join(', '));
fs.writeFileSync(F, JSON.stringify(db,null,2));
