import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as db from './lib/db.mjs';
import * as view from './lib/view.mjs';

const ROOT = import.meta.dirname;
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_TTL = 12 * 60 * 60 * 1000;
const sessions = new Map();

const MIME = {
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function sessionUser(req) {
  const sid = parseCookies(req).sid;
  if (!sid) return null;
  const s = sessions.get(sid);
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
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 2 * 1024 * 1024) { reject(new Error('too large')); req.destroy(); return; }
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function parseForm(body) {
  const out = {};
  for (const [k, v] of new URLSearchParams(body)) out[k] = v;
  return out;
}

function send(res, status, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': buf.length,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...headers
  });
  res.end(buf);
}

function redirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, ...headers });
  res.end();
}

function html(res, body, status = 200) {
  send(res, status, body, { 'Cache-Control': 'public, max-age=60' });
}

function sitemap(data) {
  const s = data.settings;
  const urls = [];
  const add = (loc, lastmod, priority = '0.7') => urls.push({ loc: s.siteUrl + loc, lastmod, priority });
  add('/', new Date().toISOString().slice(0, 10), '1.0');
  add('/matches', new Date().toISOString().slice(0, 10), '0.9');
  add('/teams', null, '0.6');
  add('/news', null, '0.6');
  for (const t of data.teams) add(`/team/${t.slug}`, null, '0.7');
  for (const m of data.matches) add(`/match/${m.slug}`, (m.updatedAt || '').slice(0, 10) || null, '0.9');
  for (const a of data.articles) add(`/news/${a.slug}`, a.date || null, '0.6');
  const days = [...new Set(data.matches.map(m => String(m.date).slice(0, 10)))];
  for (const d of days) add(`/date/${d}`, d, '0.5');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc.replace(/&/g, '&amp;')}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = url.pathname.replace(/\/+$/, '') || '/';
  const data = db.get();
  const method = req.method;

  // static
  if (p === '/app.css' || p === '/favicon.svg') {
    const file = path.join(PUBLIC, p === '/app.css' ? 'app.css' : 'favicon.svg');
    if (fs.existsSync(file)) {
      return send(res, 200, fs.readFileSync(file), {
        'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400'
      });
    }
  }

  if (p === '/healthz') return send(res, 200, 'ok', { 'Content-Type': 'text/plain' });

  if (p === '/robots.txt') {
    return send(res, 200,
      `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${data.settings.siteUrl}/sitemap.xml\n`,
      { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
  }

  if (p === '/sitemap.xml') {
    return send(res, 200, sitemap(data), { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
  }

  /* ---------- ADMIN AUTH ---------- */
  const authed = sessionUser(req);

  if (p === '/admin/login') {
    if (method === 'POST') {
      const form = parseForm(await readBody(req));
      if (checkPassword(form.password)) {
        const sid = newSession();
        return redirect(res, '/admin', {
          'Set-Cookie': `sid=${sid}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL / 1000}`
        });
      }
      return html(res, view.adminLogin(data, 'Неверный пароль'), 401);
    }
    if (authed) return redirect(res, '/admin');
    return html(res, view.adminLogin(data));
  }

  if (p === '/admin/logout' && method === 'POST') {
    const sid = parseCookies(req).sid;
    if (sid) sessions.delete(sid);
    return redirect(res, '/admin/login', { 'Set-Cookie': 'sid=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0' });
  }

  if (p.startsWith('/admin') && !authed) return redirect(res, '/admin/login');

  if (p === '/admin' && method === 'GET') {
    return html(res, view.adminDashboard(data, url.searchParams.get('ok') || ''));
  }

  if (p === '/admin/match/new') {
    if (method === 'POST') {
      const form = parseForm(await readBody(req));
      const m = db.upsertMatch(form);
      return redirect(res, `/admin/match/${m.id}?ok=${encodeURIComponent('Матч создан')}`);
    }
    return html(res, view.adminMatchForm(data, { date: new Date().toISOString().slice(0, 16), tour: 1, status: 'scheduled', home: data.teams[0]?.slug, away: data.teams[1]?.slug }));
  }

  let mm;
  if ((mm = p.match(/^\/admin\/match\/(\d+)$/))) {
    const m = data.matches.find(x => x.id === Number(mm[1]));
    if (!m) return html(res, view.notFound(data), 404);
    if (method === 'POST') {
      const form = parseForm(await readBody(req));
      db.upsertMatch({ ...form, id: m.id });
      return redirect(res, `/admin/match/${m.id}?ok=${encodeURIComponent('Сохранено')}`);
    }
    return html(res, view.adminMatchForm(data, m, url.searchParams.get('ok') || ''));
  }

  if ((mm = p.match(/^\/admin\/match\/(\d+)\/delete$/)) && method === 'POST') {
    db.deleteMatch(mm[1]);
    return redirect(res, `/admin?ok=${encodeURIComponent('Матч удалён')}`);
  }

  if (p === '/admin/texts') {
    return html(res, view.adminTexts(data, url.searchParams.get('ok') || ''));
  }

  if (p === '/admin/text/new') {
    if (method === 'POST') {
      const form = parseForm(await readBody(req));
      const a = db.upsertArticle(form);
      return redirect(res, `/admin/text/${a.id}?ok=${encodeURIComponent('Текст создан')}`);
    }
    return html(res, view.adminTextForm(data, { kind: 'news', date: new Date().toISOString().slice(0, 10) }));
  }

  if ((mm = p.match(/^\/admin\/text\/(\d+)$/))) {
    const a = data.articles.find(x => x.id === Number(mm[1]));
    if (!a) return html(res, view.notFound(data), 404);
    if (method === 'POST') {
      const form = parseForm(await readBody(req));
      db.upsertArticle({ ...form, id: a.id });
      return redirect(res, `/admin/text/${a.id}?ok=${encodeURIComponent('Сохранено')}`);
    }
    return html(res, view.adminTextForm(data, a, url.searchParams.get('ok') || ''));
  }

  if ((mm = p.match(/^\/admin\/text\/(\d+)\/delete$/)) && method === 'POST') {
    db.deleteArticle(mm[1]);
    return redirect(res, `/admin/texts?ok=${encodeURIComponent('Текст удалён')}`);
  }

  if (p === '/admin/teams') {
    return html(res, view.adminTeams(data, url.searchParams.get('ok') || ''));
  }

  if (p === '/admin/team/new') {
    if (method === 'POST') {
      const form = parseForm(await readBody(req));
      db.upsertTeam(form);
      return redirect(res, `/admin/teams?ok=${encodeURIComponent('Команда добавлена')}`);
    }
    return html(res, view.adminTeamForm(data, {}));
  }

  if ((mm = p.match(/^\/admin\/team\/(\d+)$/))) {
    const t = data.teams.find(x => x.id === Number(mm[1]));
    if (!t) return html(res, view.notFound(data), 404);
    if (method === 'POST') {
      const form = parseForm(await readBody(req));
      db.upsertTeam({ ...form, id: t.id });
      return redirect(res, `/admin/teams?ok=${encodeURIComponent('Сохранено')}`);
    }
    return html(res, view.adminTeamForm(data, t));
  }

  if (p === '/admin/settings') {
    if (method === 'POST') {
      const form = parseForm(await readBody(req));
      db.updateSettings(form);
      return redirect(res, `/admin/settings?ok=${encodeURIComponent('Настройки сохранены')}`);
    }
    return html(res, view.adminSettings(data, url.searchParams.get('ok') || ''));
  }

  /* ---------- PUBLIC ---------- */
  if (method !== 'GET' && method !== 'HEAD') return html(res, view.notFound(data), 405);

  if (p === '/') return html(res, view.home(data));

  if (p === '/matches') {
    let list = [...data.matches].sort((a, b) => new Date(a.date) - new Date(b.date));
    const q = (url.searchParams.get('q') || '').toLowerCase().trim();
    if (q) {
      const names = data.teams.filter(t => t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q)).map(t => t.slug);
      list = list.filter(m => names.includes(m.home) || names.includes(m.away));
    }
    return html(res, view.matchesPage(data, list, q ? `Матчи по запросу «${q}»` : `Все матчи ${data.settings.league}`,
      q ? `/matches?q=${encodeURIComponent(q)}` : '/matches',
      `Полный список матчей ${data.settings.league} с датой, временем начала и результатами.`));
  }

  if ((mm = p.match(/^\/date\/(\d{4}-\d{2}-\d{2})$/))) {
    const day = mm[1];
    const list = data.matches.filter(m => String(m.date).slice(0, 10) === day)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const label = list.length ? view.fmtDate(list[0].date) : day;
    return html(res, view.matchesPage(data, list, `Матчи ${label}`, `/date/${day}`,
      `Все матчи ${data.settings.league} ${label}: время начала по Москве, счёт, стадионы.`));
  }

  if ((mm = p.match(/^\/match\/([a-z0-9-]+)$/))) {
    const m = data.matches.find(x => x.slug === mm[1]);
    if (!m) return html(res, view.notFound(data), 404);
    return html(res, view.matchPage(data, m));
  }

  if (p === '/teams') return html(res, view.teamsPage(data));

  if ((mm = p.match(/^\/team\/([a-z0-9-]+)$/))) {
    const t = data.teams.find(x => x.slug === mm[1]);
    if (!t) return html(res, view.notFound(data), 404);
    return html(res, view.teamPage(data, t));
  }

  if (p === '/news') return html(res, view.newsPage(data));

  if ((mm = p.match(/^\/news\/([a-z0-9-]+)$/))) {
    const a = data.articles.find(x => x.slug === mm[1]);
    if (!a) return html(res, view.notFound(data), 404);
    return html(res, view.articlePage(data, a));
  }

  return html(res, view.notFound(data), 404);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(err => {
    console.error('[error]', err);
    if (!res.headersSent) send(res, 500, 'Internal Server Error', { 'Content-Type': 'text/plain; charset=utf-8' });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Site:  http://${HOST}:${PORT}`);
  console.log(`Admin: http://${HOST}:${PORT}/admin  (password: ${PASSWORD === 'admin123' ? 'admin123 — СМЕНИТЕ через ADMIN_PASSWORD' : 'из ADMIN_PASSWORD'})`);
});
