import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as store from './lib/db.mjs';
import * as view from './lib/view.mjs';

const ROOT = import.meta.dirname;
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_TTL = 12 * 60 * 60 * 1000;
const sessions = new Map();

const MIME = { '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8' };

function cookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function authed(req) {
  const sid = cookies(req).sid;
  const s = sid && sessions.get(sid);
  if (!s) return null;
  if (s.expires < Date.now()) { sessions.delete(sid); return null; }
  return s;
}
function newSession() {
  const sid = crypto.randomBytes(24).toString('hex');
  sessions.set(sid, { expires: Date.now() + SESSION_TTL });
  return sid;
}
function checkPassword(input) {
  const a = Buffer.from(String(input || ''));
  const b = Buffer.from(PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '', size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > 2 * 1024 * 1024) { reject(new Error('too large')); req.destroy(); return; }
      data += c;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
const parseForm = body => Object.fromEntries(new URLSearchParams(body));

function send(res, status, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': buf.length, 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'strict-origin-when-cross-origin', ...headers });
  res.end(buf);
}
const html = (res, body, status = 200) => send(res, status, body, { 'Cache-Control': 'public, max-age=60' });
const redirect = (res, to, headers = {}) => { res.writeHead(302, { Location: to, ...headers }); res.end(); };

function sitemap(db) {
  const s = db.settings;
  const urls = [];
  const add = (loc, lastmod, priority = '0.7') => urls.push({ loc: s.siteUrl + loc, lastmod, priority });
  const today = new Date().toISOString().slice(0, 10);
  add('/', today, '1.0');
  add('/countries', today, '0.9');
  add('/matches', today, '0.9');
  add('/news', null, '0.6');
  for (const c of db.countries) add(`/country/${c.slug}`, today, '0.8');
  for (const l of db.leagues) add(`/league/${l.slug}`, today, '0.9');
  for (const t of db.teams) add(`/team/${t.slug}`, null, '0.6');
  for (const m of db.matches) add(`/match/${m.slug}`, String(m.updatedAt || '').slice(0, 10) || null, '0.9');
  for (const a of db.articles) add(`/news/${a.slug}`, a.date || null, '0.5');
  for (const d of [...new Set(db.matches.map(m => String(m.date).slice(0, 10)))]) add(`/date/${d}`, d, '0.5');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc.replace(/&/g, '&amp;')}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = url.pathname.replace(/\/+$/, '') || '/';
  const db = store.get();
  const method = req.method;

  if (p === '/app.css' || p === '/favicon.svg') {
    const file = path.join(PUBLIC, p.slice(1));
    if (fs.existsSync(file)) {
      return send(res, 200, fs.readFileSync(file), { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=86400' });
    }
  }
  if (p === '/healthz') return send(res, 200, 'ok', { 'Content-Type': 'text/plain' });
  if (p === '/robots.txt') {
    return send(res, 200, `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${db.settings.siteUrl}/sitemap.xml\n`, { 'Content-Type': 'text/plain; charset=utf-8' });
  }
  if (p === '/sitemap.xml') return send(res, 200, sitemap(db), { 'Content-Type': 'application/xml; charset=utf-8' });

  /* ---------- ADMIN ---------- */
  const isAuthed = !!authed(req);

  if (p === '/admin/login') {
    if (method === 'POST') {
      const form = parseForm(await readBody(req));
      if (checkPassword(form.password)) {
        return redirect(res, '/admin', { 'Set-Cookie': `sid=${newSession()}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL / 1000}` });
      }
      return html(res, view.adminLogin(db, 'Неверный пароль'), 401);
    }
    if (isAuthed) return redirect(res, '/admin');
    return html(res, view.adminLogin(db));
  }
  if (p === '/admin/logout' && method === 'POST') {
    const sid = cookies(req).sid;
    if (sid) sessions.delete(sid);
    return redirect(res, '/admin/login', { 'Set-Cookie': 'sid=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0' });
  }
  if (p.startsWith('/admin') && !isAuthed) return redirect(res, '/admin/login');

  if (p === '/admin') return html(res, view.adminDashboard(db, url.searchParams.get('ok') || ''));

  if (p === '/admin/leagues') return html(res, view.adminLeagues(db, url.searchParams.get('ok') || ''));
  if (p === '/admin/country' && method === 'POST') {
    store.upsertCountry(parseForm(await readBody(req)));
    return redirect(res, '/admin/leagues?ok=' + encodeURIComponent('Страна добавлена'));
  }
  if (p === '/admin/league' && method === 'POST') {
    store.upsertLeague(parseForm(await readBody(req)));
    return redirect(res, '/admin/leagues?ok=' + encodeURIComponent('Лига добавлена'));
  }

  if (p === '/admin/teams') return html(res, view.adminTeams(db, url.searchParams.get('ok') || ''));
  if (p === '/admin/team/new' && method === 'POST') {
    store.upsertTeam(parseForm(await readBody(req)));
    return redirect(res, '/admin/teams?ok=' + encodeURIComponent('Команда добавлена'));
  }
  let mm;
  if ((mm = p.match(/^\/admin\/team\/(\d+)$/))) {
    const t = db.teams.find(x => x.id === Number(mm[1]));
    if (!t) return html(res, view.notFound(db), 404);
    if (method === 'POST') {
      store.upsertTeam({ ...parseForm(await readBody(req)), id: t.id });
      return redirect(res, '/admin/teams?ok=' + encodeURIComponent('Сохранено'));
    }
    return html(res, view.adminTeamForm(db, t));
  }

  if (p === '/admin/texts') return html(res, view.adminTexts(db, url.searchParams.get('ok') || ''));
  if (p === '/admin/text/new') {
    if (method === 'POST') {
      const a = store.upsertArticle(parseForm(await readBody(req)));
      return redirect(res, `/admin/text/${a.id}?ok=` + encodeURIComponent('Текст создан'));
    }
    return html(res, view.adminTextForm(db, { kind: 'news', date: new Date().toISOString().slice(0, 10) }));
  }
  if ((mm = p.match(/^\/admin\/text\/(\d+)$/))) {
    const a = db.articles.find(x => x.id === Number(mm[1]));
    if (!a) return html(res, view.notFound(db), 404);
    if (method === 'POST') {
      store.upsertArticle({ ...parseForm(await readBody(req)), id: a.id });
      return redirect(res, `/admin/text/${a.id}?ok=` + encodeURIComponent('Сохранено'));
    }
    return html(res, view.adminTextForm(db, a, url.searchParams.get('ok') || ''));
  }
  if ((mm = p.match(/^\/admin\/text\/(\d+)\/delete$/)) && method === 'POST') {
    store.deleteArticle(mm[1]);
    return redirect(res, '/admin/texts?ok=' + encodeURIComponent('Удалено'));
  }

  if (p === '/admin/match/new') {
    if (method === 'POST') {
      const m = store.upsertMatch(parseForm(await readBody(req)));
      return redirect(res, `/admin/match/${m.id}?ok=` + encodeURIComponent('Матч создан'));
    }
    return html(res, view.adminMatchForm(db, { date: new Date().toISOString().slice(0, 16), status: 'scheduled', league: db.leagues[0]?.slug, home: '', away: '' }));
  }
  if ((mm = p.match(/^\/admin\/match\/(\d+)$/))) {
    const m = db.matches.find(x => x.id === Number(mm[1]));
    if (!m) return html(res, view.notFound(db), 404);
    if (method === 'POST') {
      store.upsertMatch({ ...parseForm(await readBody(req)), id: m.id });
      return redirect(res, `/admin/match/${m.id}?ok=` + encodeURIComponent('Сохранено'));
    }
    return html(res, view.adminMatchForm(db, m, url.searchParams.get('ok') || ''));
  }
  if ((mm = p.match(/^\/admin\/match\/(\d+)\/delete$/)) && method === 'POST') {
    store.deleteMatch(mm[1]);
    return redirect(res, '/admin?ok=' + encodeURIComponent('Матч удалён'));
  }

  if (p === '/admin/settings') {
    if (method === 'POST') {
      store.updateSettings(parseForm(await readBody(req)));
      return redirect(res, '/admin/settings?ok=' + encodeURIComponent('Сохранено'));
    }
    return html(res, view.adminSettings(db, url.searchParams.get('ok') || ''));
  }

  /* ---------- PUBLIC ---------- */
  if (method !== 'GET' && method !== 'HEAD') return html(res, view.notFound(db), 405);

  if (p === '/') return html(res, view.home(db));
  if (p === '/countries') return html(res, view.countriesPage(db));

  if (p === '/matches') {
    const q = (url.searchParams.get('q') || '').trim();
    let list;
    if (q) {
      const ql = q.toLowerCase();
      const teamSlugs = db.teams.filter(t => t.name.toLowerCase().includes(ql) || t.original?.toLowerCase().includes(ql)).map(t => t.slug);
      list = db.matches.filter(m => teamSlugs.includes(m.home) || teamSlugs.includes(m.away)).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 100);
    } else {
      const up = db.matches.filter(m => m.status !== 'finished').sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 50);
      const res2 = db.matches.filter(m => m.status === 'finished').sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
      list = [...up, ...res2];
    }
    return html(res, view.matchesPage(db, list, q ? `Матчи: ${q}` : 'Все матчи', q ? `/matches?q=${encodeURIComponent(q)}` : '/matches',
      'Расписание и результаты матчей футбольных лиг мира: дата, время по Москве, счёт.'));
  }

  if ((mm = p.match(/^\/date\/(\d{4}-\d{2}-\d{2})$/))) {
    const day = mm[1];
    const list = db.matches.filter(m => String(m.date).slice(0, 10) === day).sort((a, b) => new Date(a.date) - new Date(b.date));
    const label = list.length ? view.fmtDate(list[0].date) : day;
    return html(res, view.matchesPage(db, list, `Матчи ${label}`, `/date/${day}`, `Все футбольные матчи ${label}: время начала по Москве, счёт, турниры.`));
  }

  if ((mm = p.match(/^\/country\/([a-z0-9-]+)$/))) {
    const c = db.countries.find(x => x.slug === mm[1]);
    if (!c) return html(res, view.notFound(db), 404);
    return html(res, view.countryPage(db, c));
  }

  if ((mm = p.match(/^\/league\/([a-z0-9.-]+)$/))) {
    const l = db.leagues.find(x => x.slug === mm[1]);
    if (!l) return html(res, view.notFound(db), 404);
    return html(res, view.leaguePage(db, l));
  }

  if ((mm = p.match(/^\/match\/([a-z0-9-]+)$/))) {
    const m = db.matches.find(x => x.slug === mm[1]);
    if (!m) return html(res, view.notFound(db), 404);
    return html(res, view.matchPage(db, m));
  }

  if ((mm = p.match(/^\/team\/([a-z0-9-]+)$/))) {
    const t = db.teams.find(x => x.slug === mm[1]);
    if (!t) return html(res, view.notFound(db), 404);
    return html(res, view.teamPage(db, t));
  }

  if (p === '/news') return html(res, view.newsPage(db));
  if ((mm = p.match(/^\/news\/([a-z0-9-]+)$/))) {
    const a = db.articles.find(x => x.slug === mm[1]);
    if (!a) return html(res, view.notFound(db), 404);
    return html(res, view.articlePage(db, a));
  }

  return html(res, view.notFound(db), 404);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(err => {
    console.error('[error]', err);
    if (!res.headersSent) send(res, 500, 'Internal Server Error', { 'Content-Type': 'text/plain; charset=utf-8' });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Site:  http://${HOST}:${PORT}`);
  console.log(`Admin: http://${HOST}:${PORT}/admin  (${PASSWORD === 'admin123' ? 'пароль admin123 — смените через ADMIN_PASSWORD' : 'пароль из ADMIN_PASSWORD'})`);
});
