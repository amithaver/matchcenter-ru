// Импорт ВСЕХ лиг ESPN по дням: /soccer/all/scoreboard?dates=ГГГГММДД
// Пересобирает матчи и справочники, сохраняя тексты, настройки и таблицы.
import fs from 'node:fs';

const FILE = 'data/store.json';
const old = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const BACK = Number(process.env.BACK || 30);
const FWD = Number(process.env.FWD || 14);

const TYPE_RU = {
  'Goal': 'Гол', 'Goal - Header': 'Гол головой', 'Goal - Volley': 'Гол с лёта',
  'Penalty - Scored': 'Гол с пенальти', 'Own Goal': 'Автогол',
  'Yellow Card': 'Жёлтая карточка', 'Red Card': 'Красная карточка',
  'Second Yellow Card': 'Вторая жёлтая', 'Substitution': 'Замена'
};

const ES = [['ch','ч'],['sh','ш'],['ph','ф'],['th','т'],['ck','к'],['oo','у'],['ee','и'],['qu','к'],
  ['gue','ге'],['gui','ги'],['ge','хе'],['gi','хи'],['ce','се'],['ci','си'],['ll','ль'],['ñ','нь'],
  ['á','а'],['é','е'],['í','и'],['ó','о'],['ú','у'],['ü','у'],['ç','с'],['ã','а'],['õ','о']];
const MAP = { a:'а',b:'б',c:'к',d:'д',e:'е',f:'ф',g:'г',h:'х',i:'и',j:'х',k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',
  q:'к',r:'р',s:'с',t:'т',u:'у',v:'в',w:'в',x:'кс',y:'й',z:'с',' ':' ','-':'-',"'":'', '.':'' };

function translit(src) {
  let s = String(src).toLowerCase().trim();
  for (const [a, b] of ES) s = s.split(a).join('\u0001' + b + '\u0002');
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\u0001') { out += s[i + 1]; i += 2; continue; }
    if (ch === '\u0002') continue;
    out += MAP[ch] ?? ch;
  }
  return out.split(/\s+/).filter(Boolean).map((w, i) => {
    const c = w.replace(/й$/, 'и');
    return i ? c : c.charAt(0).toUpperCase() + c.slice(1);
  }).join(' ');
}
const slugify = s => String(s).toLowerCase()
  .replace(/[а-яё]/g, ch => ({'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'}[ch] || ch))
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const countries = new Map(old.countries.map(c => [c.slug, { ...c }]));
const leagues = new Map();
const teams = new Map();
const matches = new Map();
let id = 0;

const leagueKey = (name, seasonSlug) => slugify((seasonSlug || name || 'other').replace(/^\d{4}(-\d{2})?-/, '')) || 'other';

const days = [];
for (let d = -BACK; d <= FWD; d++) {
  const x = new Date(Date.now() + d * 86400000);
  days.push(x.toISOString().slice(0, 10).replace(/-/g, ''));
}

let raw = 0, failed = 0;
for (const day of days) {
  let j = null;
  try {
    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${day}`, { signal: AbortSignal.timeout(30000) });
    j = await r.json();
  } catch { failed++; continue; }
  for (const ev of j?.events || []) {
    const comp = ev.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home');
    const away = comp?.competitors?.find(c => c.homeAway === 'away');
    if (!home || !away) continue;
    const lname = comp.altGameNote || ev.season?.slug || 'Футбол';
    const lkey = leagueKey(lname, ev.season?.slug);
    if (!leagues.has(lkey)) {
      leagues.set(lkey, { slug: lkey, country: '', name: lname, espn: '', season: String(ev.season?.year || 2026) });
    }
    const mk = (t) => {
      const slug = slugify(translit(t.displayName));
      if (!teams.has(slug)) teams.set(slug, { slug, name: translit(t.displayName), original: t.displayName, league: lkey, country: '' });
      return slug;
    };
    const h = mk(home.team), a = mk(away.team);
    const iso = String(ev.date).slice(0, 10);
    const st = ev.status?.type?.name === 'STATUS_FULL_TIME' ? 'finished'
      : /IN_PROGRESS|HALFTIME/.test(ev.status?.type?.name || '') ? 'live' : 'scheduled';
    const slug = `${h}-${a}-${iso}`;
    if (matches.has(slug)) continue;
    const events = (comp.details || []).map(d => ({
      min: d.clock?.displayValue || '', type: TYPE_RU[d.type?.text] || d.type?.text || '',
      side: d.team?.id === home.team.id ? 'home' : 'away',
      player: d.athletesInvolved?.[0]?.displayName || ''
    })).filter(e => e.type);
    matches.set(slug, {
      id: ++id, slug, league: lkey, season: String(ev.season?.year || 2026),
      home: h, away: a, date: ev.date, status: st,
      scoreHome: st === 'scheduled' ? null : Number(home.score),
      scoreAway: st === 'scheduled' ? null : Number(away.score),
      venue: comp.venue?.fullName || '', city: comp.venue?.address?.city || '',
      events, preview: '', report: '', source: 'espn', updatedAt: new Date().toISOString()
    });
    raw++;
  }
  await new Promise(r => setTimeout(r, 60));
}

// сохраняем старые анонсы, если матч тот же
for (const m of old.matches) {
  const cur = matches.get(m.slug);
  if (cur && m.preview) cur.preview = m.preview;
}

const store = {
  settings: old.settings,
  countries: [...countries.values()],
  leagues: [...leagues.values()].sort((a, b) => a.name.localeCompare(b.name)),
  teams: [...teams.values()],
  matches: [...matches.values()].sort((a, b) => new Date(a.date) - new Date(b.date)),
  tables: old.tables || [],
  articles: old.articles,
  counters: old.counters
};
fs.writeFileSync(FILE, JSON.stringify(store, null, 2));
console.log(`дней: ${days.length}, ошибок запроса: ${failed}`);
console.log(`матчей: ${store.matches.length}, лиг: ${store.leagues.length}, команд: ${store.teams.length}`);
console.log(`диапазон: ${store.matches[0]?.date} … ${store.matches.at(-1)?.date}`);
console.log(`размер store.json: ${(fs.statSync(FILE).size / 1048576).toFixed(1)} МБ`);
