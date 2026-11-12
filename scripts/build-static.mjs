// Статическая сборка: генерирует HTML для всех страниц в dist/
import fs from 'node:fs';
import path from 'node:path';
import * as view from '../lib/view.mjs';

const db = JSON.parse(fs.readFileSync('data/store.json', 'utf8'));
const OUT = 'dist';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const write = (rel, html) => {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};
const page = (dir, html) => write(path.join(dir, 'index.html'), html);

let n = 0;
const put = (dir, html) => { page(dir, html); n++; };

put('', view.home(db));
put('matches', view.matchesPage(db, [...db.matches].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 200), 'Все матчи', '/matches', 'Расписание и результаты матчей.'));
put('countries', view.countriesPage(db));
put('news', view.newsPage(db));

for (const c of db.countries) put(`country/${c.slug}`, view.countryPage(db, c));
for (const l of db.leagues) put(`league/${l.slug}`, view.leaguePage(db, l));
const PAGE_MATCHES = db.matches.filter(m => new Date(m.date).getTime() > Date.now() - 14 * 86400000);
const PAGE_TEAMS = new Set();
PAGE_MATCHES.forEach(m => { PAGE_TEAMS.add(m.home); PAGE_TEAMS.add(m.away); });

for (const m of PAGE_MATCHES) put(`match/${m.slug}`, view.matchPage(db, m));
for (const t of db.teams.filter(t => PAGE_TEAMS.has(t.slug))) put(`team/${t.slug}`, view.teamPage(db, t));
for (const a of db.articles) put(`news/${a.slug}`, view.articlePage(db, a));

const days = [...new Set(db.matches.map(m => String(m.date).slice(0, 10)))];
for (const d of days) {
  const list = db.matches.filter(m => String(m.date).slice(0, 10) === d);
  put(`date/${d}`, view.matchesPage(db, list, `Матчи ${view.fmtDate(list[0].date)}`, `/date/${d}`, `Все матчи ${view.fmtDate(list[0].date)}.`));
}

// sitemap
const urls = [];
const add = (loc, prio = '0.7') => urls.push(`  <url><loc>${db.settings.siteUrl}${loc}</loc><priority>${prio}</priority></url>`);
add('/', '1.0'); add('/matches', '0.9'); add('/countries', '0.9'); add('/news', '0.6');
db.countries.forEach(c => add(`/country/${c.slug}`, '0.8'));
db.leagues.forEach(l => add(`/league/${l.slug}`, '0.9'));
db.teams.forEach(t => add(`/team/${t.slug}`, '0.6'));
db.matches.forEach(m => add(`/match/${m.slug}`, '0.9'));
db.articles.forEach(a => add(`/news/${a.slug}`, '0.5'));
days.forEach(d => add(`/date/${d}`, '0.5'));
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${db.settings.siteUrl}/sitemap.xml\n`);

// статика
for (const f of ['app.css', 'favicon.svg']) fs.copyFileSync(path.join('public', f), path.join(OUT, f));
if (fs.existsSync('public/covers')) fs.cpSync('public/covers', path.join(OUT, 'covers'), { recursive: true });

const size = dir => fs.readdirSync(dir, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
console.log(`страниц: ${n}, URL в sitemap: ${urls.length}, объём: ${(size(OUT) / 1048576).toFixed(1)} МБ`);
