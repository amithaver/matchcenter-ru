// Схлопывает стадии турниров (Финал, 1/2, Round 1...) в один турнир по названию до запятой.
import fs from 'node:fs';
const FILE = 'data/store.json';
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const ES = [['ch','ч'],['sh','ш'],['ph','ф'],['th','т'],['ck','к'],['oo','у'],['ee','и'],['qu','к'],
  ['gue','ге'],['gui','ги'],['ge','хе'],['gi','хи'],['ce','се'],['ci','си'],['ll','ль'],['ñ','нь'],
  ['á','а'],['é','е'],['í','и'],['ó','о'],['ú','у'],['ü','у'],['ç','с'],['ã','а'],['õ','о']];
const MAP = { a:'а',b:'б',c:'к',d:'д',e:'е',f:'ф',g:'г',h:'х',i:'и',j:'х',k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',
  q:'к',r:'р',s:'с',t:'т',u:'у',v:'в',w:'в',x:'кс',y:'й',z:'с',' ':' ','-':'-',"'":'', '.':'' };
const translit = src => {
  let s = String(src).toLowerCase().trim();
  for (const [a, b] of ES) s = s.split(a).join('\u0001' + b + '\u0002');
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\u0001') { out += s[i + 1]; i += 2; continue; }
    if (ch === '\u0002') continue;
    out += MAP[ch] ?? ch;
  }
  return out.split(/\s+/).filter(Boolean).map((w, i) => i ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};
const slugify = s => String(s).toLowerCase()
  .replace(/[а-яё]/g, ch => ({'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'}[ch] || ch))
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const baseName = name => String(name).split(',')[0].trim();
const merged = new Map();
const remap = new Map();

for (const l of db.leagues) {
  const name = baseName(l.name);
  const key = slugify(translit(name)) || l.slug;
  remap.set(l.slug, key);
  if (!merged.has(key)) merged.set(key, { slug: key, country: l.country === 'other' ? '' : (l.country || ''), name, espn: '', season: l.season });
}

const old = db.leagues.length;
db.leagues = [...merged.values()];
for (const m of db.matches) m.league = remap.get(m.league) || m.league;
for (const t of db.teams) t.league = remap.get(t.league) || t.league;
for (const tb of db.tables || []) tb.league = remap.get(tb.league) || tb.league;

fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
console.log(`лиг было ${old}, стало ${db.leagues.length}`);
