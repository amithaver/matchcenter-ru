import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const FILE = path.join(DATA_DIR, 'store.json');

let db = null;

export function load() {
  if (db) return db;
  if (!fs.existsSync(FILE)) throw new Error('Нет data/store.json — запустите: node scripts/import-espn.mjs');
  db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  db.counters ||= { nextArticle: 1 };
  return db;
}

export function save() {
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, FILE);
}

export const get = () => load();

export const findCountry = s => load().countries.find(c => c.slug === s);
export const findLeague = s => load().leagues.find(l => l.slug === s);
export const findTeam = s => load().teams.find(t => t.slug === s);
export const findMatch = s => load().matches.find(m => m.slug === s);
export const findArticle = s => load().articles.find(a => a.slug === s);

export const teamName = s => findTeam(s)?.name || s;
export const leagueName = s => findLeague(s)?.name || s;

export function leaguesOfCountry(cslug) {
  return load().leagues.filter(l => l.country === cslug);
}

export function matchesOfLeague(lslug) {
  return load().matches.filter(m => m.league === lslug)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
export function matchesOfTeam(tslug) {
  return load().matches.filter(m => m.home === tslug || m.away === tslug)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
export function upcoming(limit = 8) {
  const now = Date.now();
  return load().matches.filter(m => new Date(m.date).getTime() >= now - 3 * 3600e3 && m.status !== 'finished')
    .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, limit);
}
export function live() {
  return load().matches.filter(m => m.status === 'live');
}
export function results(limit = 8) {
  return load().matches.filter(m => m.status === 'finished')
    .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
}
export function matchesOnDay(day) {
  return load().matches.filter(m => String(m.date).slice(0, 10) === day)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
export function h2h(home, away) {
  return load().matches.filter(m =>
    (m.home === home && m.away === away) || (m.home === away && m.away === home))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
export function form(tslug, n = 5) {
  return load().matches
    .filter(m => m.status === 'finished' && (m.home === tslug || m.away === tslug))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-n)
    .map(m => {
      const isHome = m.home === tslug;
      const gf = isHome ? m.scoreHome : m.scoreAway;
      const ga = isHome ? m.scoreAway : m.scoreHome;
      return gf > ga ? 'В' : gf < ga ? 'П' : 'Н';
    });
}
export function scorers(lslug, limit = 10) {
  const acc = new Map();
  for (const m of load().matches) {
    if (m.league !== lslug) continue;
    for (const e of m.events || []) {
      if (!e.type || !/^(Гол|Гол головой|Гол с лёта|Гол с пенальти)/.test(e.type)) continue;
      if (!e.player) continue;
      const key = e.player;
      const cur = acc.get(key) || { player: e.player, team: e.side === 'home' ? m.home : m.away, goals: 0 };
      cur.goals++;
      acc.set(key, cur);
    }
  }
  return [...acc.values()].sort((a, b) => b.goals - a.goals).slice(0, limit);
}

export function slugify(s) {
  return String(s || '').toLowerCase()
    .replace(/[а-яё]/g, ch => ({ 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya' }[ch] || ch))
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function normDate(s) {
  const v = String(s || '').trim();
  if (!v) return new Date().toISOString();
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(v)) return v;
  return v.length === 16 ? `${v}:00+03:00` : `${v}+03:00`;
}

export function matchSlug(home, away, date) {
  return `${home}-${away}-${normDate(date).slice(0, 10)}`;
}

function parseEvents(text) {
  if (!text) return [];
  return String(text).split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const [min, type, side, player] = line.split('|').map(x => (x || '').trim());
    return { min: min || '', type: type || 'Гол', side: side === 'away' ? 'away' : 'home', player: player || '' };
  });
}

export function upsertMatch(d) {
  const data = load();
  const date = normDate(d.date);
  const slug = matchSlug(d.home, d.away, date);
  const payload = {
    home: d.home, away: d.away, date, league: d.league,
    season: d.season || findLeague(d.league)?.season || '2026',
    status: d.status || 'scheduled',
    scoreHome: d.scoreHome === '' || d.scoreHome == null ? null : Number(d.scoreHome),
    scoreAway: d.scoreAway === '' || d.scoreAway == null ? null : Number(d.scoreAway),
    venue: d.venue || '', city: d.city || '',
    preview: d.preview || '', report: d.report || '',
    events: parseEvents(d.eventsText),
    updatedAt: new Date().toISOString()
  };
  if (d.id) {
    const m = data.matches.find(x => x.id === Number(d.id));
    if (!m) return null;
    if (d.eventsText === undefined) payload.events = m.events;
    Object.assign(m, payload, { slug });
    save();
    return m;
  }
  const m = { id: (Math.max(0, ...data.matches.map(x => x.id)) + 1), slug, ...payload, source: 'manual' };
  data.matches.push(m);
  save();
  return m;
}

export function deleteMatch(id) {
  const data = load();
  const i = data.matches.findIndex(m => m.id === Number(id));
  if (i < 0) return false;
  data.matches.splice(i, 1);
  save();
  return true;
}

export function upsertArticle(d) {
  const data = load();
  const slug = slugify(d.slug || d.title);
  if (d.id) {
    const a = data.articles.find(x => x.id === Number(d.id));
    if (!a) return null;
    Object.assign(a, { slug, title: d.title, excerpt: d.excerpt || '', body: d.body || '', kind: d.kind === 'page' ? 'page' : 'news', date: d.date || a.date });
    save();
    return a;
  }
  const a = { id: data.counters.nextArticle++, slug, title: d.title, excerpt: d.excerpt || '', body: d.body || '', kind: d.kind === 'page' ? 'page' : 'news', date: d.date || new Date().toISOString().slice(0, 10) };
  data.articles.push(a);
  save();
  return a;
}

export function deleteArticle(id) {
  const data = load();
  const i = data.articles.findIndex(a => a.id === Number(id));
  if (i < 0) return false;
  data.articles.splice(i, 1);
  save();
  return true;
}

export function upsertTeam(d) {
  const data = load();
  if (d.id) {
    const t = data.teams.find(x => x.id === Number(d.id));
    if (!t) return null;
    Object.assign(t, { name: d.name, city: d.city || '', stadium: d.stadium || '' });
    save();
    return t;
  }
  const slug = slugify(d.slug || d.name);
  const t = { id: Math.max(0, ...data.teams.map(x => x.id)) + 1, slug, name: d.name, original: d.name, city: d.city || '', stadium: d.stadium || '', league: d.league, country: findLeague(d.league)?.country };
  data.teams.push(t);
  save();
  return t;
}

export function upsertLeague(d) {
  const data = load();
  const slug = slugify(d.slug || d.name);
  const payload = { slug, country: d.country, name: d.name, espn: '', season: d.season || '2026' };
  const existing = d.oldSlug ? data.leagues.find(x => x.slug === d.oldSlug) : data.leagues.find(x => x.slug === slug);
  if (existing) {
    Object.assign(existing, payload);
  } else {
    data.leagues.push(payload);
  }
  save();
  return payload;
}

export function upsertCountry(d) {
  const data = load();
  const slug = slugify(d.slug || d.name);
  if (!data.countries.find(c => c.slug === slug)) data.countries.push({ slug, name: d.name, confed: d.confed || '' });
  save();
  return { slug };
}

export function updateSettings(patch) {
  const data = load();
  data.settings = { ...data.settings, ...patch };
  save();
  return data.settings;
}
