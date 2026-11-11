import * as store from './db.mjs';
import { flag } from './flags.mjs';

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const TZ = 'Europe/Moscow';

const scorers = l => store.scorers(l);
const h2h = (h, a) => store.h2h(h, a);
const form = t => store.form(t);

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function teamColor(name) {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 52% 55%)`;
}

const teamLabel = name => `<span class="tn"><i class="cd" style="--c:${teamColor(name)}"></i><span class="nm">${esc(name)}</span></span>`;

export function adSlot(label = '728×90') {
  return `<aside class="ad" aria-label="Реклама"><span>Реклама</span><div class="ad-box">${esc(label)}</div></aside>`;
}

function parts(d, opts) {
  const fmt = new Intl.DateTimeFormat('ru-RU', { timeZone: TZ, hourCycle: 'h23', ...opts });
  const o = {};
  for (const p of fmt.formatToParts(new Date(d))) o[p.type] = p.value;
  return o;
}
export function fmtDate(d) {
  const p = parts(d, { day: 'numeric', month: 'numeric', year: 'numeric' });
  return `${String(p.day).replace(/^0/, '')} ${MONTHS[Number(p.month) - 1]} ${p.year}`;
}
export const fmtShort = d => { const p = parts(d, { day: 'numeric', month: 'numeric' }); return `${p.day} ${MONTHS[Number(p.month) - 1].slice(0, 3)}`; };
export const fmtTime = d => { const p = parts(d, { hour: '2-digit', minute: '2-digit' }); return `${p.hour}:${p.minute}`; };
export const fmtWeekday = d => parts(d, { weekday: 'long' }).weekday;
export const isoDay = d => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d));

export const statusLabel = m => m.status === 'finished' ? 'Завершён' : m.status === 'live' ? 'Идёт' : 'Не начался';

export function layout(database, o) {
  const s = database.settings;
  const title = o.title ? `${o.title} — ${s.siteName}` : `${s.siteName} — ${s.tagline}`;
  const desc = o.description || s.tagline;
  const canonical = o.canonical ? `${s.siteUrl}${o.canonical}` : s.siteUrl + '/';
  const jsonld = (o.jsonld || []).map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('');
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="${o.noindex ? 'noindex,nofollow' : 'index,follow'}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(s.siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:locale" content="ru_RU">
<meta name="geo.region" content="RU">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/app.css">
${jsonld}
</head>
<body>
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="/">${esc(s.siteName)}<span>футбол</span></a>
    <nav>
      <a href="/matches">Матчи</a>
      <a href="/countries">Страны</a>
      <a href="/news">Новости</a>
      <a href="/admin">Админка</a>
    </nav>
  </div>
</header>
<main class="wrap">
${o.content}
</main>
<footer class="foot">
  <div class="wrap">
    <p>${esc(s.siteName)} — расписание, результаты и таблицы футбольных лиг мира. Ставок и букмекерской рекламы нет.</p>
    <p>© 2026 · <a href="/news/o-saite">О сайте</a> · <a href="/sitemap.xml">Карта сайта</a> · <a href="/admin">Управление</a></p>
  </div>
</footer>
</body>
</html>`;
}

export function breadcrumbs(items) {
  return `<nav class="crumbs" aria-label="Хлебные крошки">${items.map((it, i) => i === items.length - 1
    ? `<span>${esc(it.name)}</span>`
    : `<a href="${esc(it.url)}">${esc(it.name)}</a>`).join('<i>/</i>')}</nav>`;
}

const badge = name => `<span class="badge" aria-hidden="true">${esc(String(name).slice(0, 1))}</span>`;

export function matchRow(db, m, opts = {}) {
  const home = db.teams.find(t => t.slug === m.home);
  const away = db.teams.find(t => t.slug === m.away);
  const finished = m.status === 'finished';
  const liveNow = m.status === 'live';
  const score = finished || liveNow ? `${m.scoreHome ?? 0}:${m.scoreAway ?? 0}` : fmtTime(m.date);
  const league = db.leagues.find(l => l.slug === m.league);
  const country = league ? db.countries.find(c => c.slug === league.country) : null;
  const meta = [country?.name, league?.name].filter(Boolean).join(' · ');
  return `<a class="match ${liveNow ? 'is-live' : ''}" href="/match/${esc(m.slug)}" title="${esc(meta)}">
    <div class="md"><b>${fmtShort(m.date)}</b><span>${opts.showLeague ? fmtTime(m.date) : ''}</span></div>
    <div class="mt">
      <div class="t home">${teamLabel(home?.name || m.home)}</div>
      <div class="th">—</div>
      <div class="t away">${teamLabel(away?.name || m.away)}</div>
    </div>
    <div class="ms ${finished ? 'fin' : ''}">${score}</div>
  </a>`;
}

export function matchList(db, list, opts = {}) {
  if (!list.length) return '<p class="empty">Матчей пока нет.</p>';
  return `<div class="matches">${list.map(m => matchRow(db, m, opts)).join('')}</div>`;
}

export function tableBlock(db, rows) {
  if (!rows?.length) return '';
  return `<div class="table-wrap"><table class="standings">
    <thead><tr><th>#</th><th>Команда</th><th>И</th><th>В</th><th>Н</th><th>П</th><th>Г</th><th>О</th></tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td class="rk">${r.rank}</td>
      <td><a href="/team/${esc(r.team)}">${esc(db.teams.find(t => t.slug === r.team)?.name || r.team)}</a></td>
      <td>${r.played}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
      <td>${r.gf}:${r.ga}</td><td class="pts">${r.pts}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

export function home(db) {
  const up = db.matches.filter(m => m.status !== 'finished' && new Date(m.date).getTime() > Date.now() - 3600e3)
    .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 8);
  const res = db.matches.filter(m => m.status === 'finished').sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  const liveNow = db.matches.filter(m => m.status === 'live');
  const countries = db.countries;
  const news = db.articles.filter(a => a.kind === 'news').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const content = `
<section class="hero">
  <h1>Футбол сегодня: расписание матчей, результаты и таблицы</h1>
  <p class="lead">Матч-центр мирового футбола: Англия, Испания, Латинская Америка, Карибский бассейн. Дата и время каждого матча по Москве. Без ставок и коэффициентов.</p>
</section>
${adSlot('728×90 · лидерборд')}
${liveNow.length ? `<section><div class="sec-h"><h2>Идут сейчас</h2></div>${matchList(db, liveNow, { showLeague: true })}</section>` : ''}
<section>
  <div class="sec-h"><h2>Ближайшие матчи</h2><a href="/matches">Все матчи →</a></div>
  ${matchList(db, up, { showLeague: true })}
</section>
<section>
  <div class="sec-h"><h2>Последние результаты</h2></div>
  ${matchList(db, res, { showLeague: true })}
</section>
<section>
  <div class="sec-h"><h2>Страны и лиги</h2><a href="/countries">Все страны →</a></div>
  <div class="grid">${countries.map(c => {
    const ls = db.leagues.filter(l => l.country === c.slug);
    return `<a class="tile" href="/country/${esc(c.slug)}"><span class="ct">${flag(c.slug)}<b>${esc(c.name)}</b></span><span>${esc(ls.map(l => l.name).join(', '))}</span></a>`;
  }).join('')}</div>
</section>
${news.length ? `<section><div class="sec-h"><h2>Новости</h2><a href="/news">Все материалы →</a></div>
<div class="cards">${news.map(a => `<a class="card" href="/news/${esc(a.slug)}"><time>${esc(fmtDate(a.date))}</time><b>${esc(a.title)}</b><span>${esc(a.excerpt)}</span></a>`).join('')}</div></section>` : ''}`;
  return layout(db, {
    title: 'Футбол сегодня — расписание, результаты, таблицы',
    description: 'Матчи футбольных лиг мира сегодня: дата и время по Москве, счёт, турнирные таблицы. Редкие чемпионаты Карибского бассейна и Латинской Америки.',
    canonical: '/',
    content,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: db.settings.siteName, url: db.settings.siteUrl, inLanguage: 'ru-RU' }]
  });
}

export function countriesPage(db) {
  const content = `
${breadcrumbs([{ name: 'Главная', url: '/' }, { name: 'Страны' }])}
<h1>Страны и футбольные лиги</h1>
<p class="lead">Чемпионаты Европы, Латинской Америки и Карибского бассейна: расписание, результаты, турнирные таблицы.</p>
<div class="grid">${db.countries.map(c => {
    const ls = db.leagues.filter(l => l.country === c.slug);
    return `<a class="tile" href="/country/${esc(c.slug)}"><span class="ct">${flag(c.slug)}<b>${esc(c.name)}</b></span><span>${esc(c.confed || '')}${ls.length ? ' · ' + esc(ls.map(l => l.name).join(', ')) : ''}</span></a>`;
  }).join('')}</div>`;
  return layout(db, { title: 'Страны и лиги', description: 'Футбольные лиги по странам: Европа, Латинская Америка, Карибы. Расписание и таблицы.', canonical: '/countries', content });
}

export function countryPage(db, country) {
  const ls = db.leagues.filter(l => l.country === country.slug);
  const lslugs = ls.map(l => l.slug);
  const ms = db.matches.filter(m => lslugs.includes(m.league));
  const up = ms.filter(m => m.status !== 'finished').sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 10);
  const res = ms.filter(m => m.status === 'finished').sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  const teams = db.teams.filter(t => lslugs.includes(t.league)).slice(0, 40);
  const content = `
${breadcrumbs([{ name: 'Главная', url: '/' }, { name: 'Страны', url: '/countries' }, { name: country.name }])}
<h1>${flag(country.slug, 'flag lg')}Футбол ${esc(country.name)}: лиги, матчи, таблицы</h1>
<p class="lead">${esc(country.confed ? country.confed + '. ' : '')}Расписание и результаты матчей, турнирные таблицы чемпионата ${esc(country.name)}.</p>
${ls.length ? `<h2>Лиги</h2><ul class="links">${ls.map(l => `<li><a href="/league/${esc(l.slug)}">${esc(l.name)} ${esc(l.season)} — таблица и матчи</a></li>`).join('')}</ul>` : ''}
<h2>Ближайшие матчи</h2>${matchList(db, up)}
<h2>Последние результаты</h2>${matchList(db, res)}
${teams.length ? `<h2>Команды</h2><div class="grid small">${teams.map(t => `<a class="tile" href="/team/${esc(t.slug)}"><b>${esc(t.name)}</b></a>`).join('')}</div>` : ''}`;
  return layout(db, {
    title: `Футбол ${country.name}: расписание, результаты, таблицы`,
    description: `Матчи и турнирные таблицы чемпионата ${country.name}: даты, время по Москве, счёт, положение команд.`,
    canonical: `/country/${country.slug}`,
    content,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'SportsOrganization', name: `Футбол ${country.name}`, sport: 'Football', areaServed: country.name }]
  });
}

export function leaguePage(db, league) {
  const country = db.countries.find(c => c.slug === league.country);
  const ms = db.matches.filter(m => m.league === league.slug).sort((a, b) => new Date(a.date) - new Date(b.date));
  const up = ms.filter(m => m.status !== 'finished').slice(0, 12);
  const res = ms.filter(m => m.status === 'finished').slice().reverse().slice(0, 12);
  const table = db.tables.find(t => t.league === league.slug);
  const sc = scorers(league.slug);
  const content = `
${breadcrumbs([{ name: 'Главная', url: '/' }, { name: 'Страны', url: '/countries' }, { name: country?.name || '', url: `/country/${league.country}` }, { name: league.name }])}
<h1>${esc(league.name)} (${esc(country?.name || '')}) ${esc(league.season)}: таблица и матчи</h1>
<p class="lead">Турнирная таблица, календарь и результаты турнира ${esc(league.name)} (${esc(country?.name || '')}), сезон ${esc(league.season)}. Время матчей — по Москве.</p>
${table ? `<h2>Турнирная таблица</h2>${tableBlock(db, table.rows)}<p class="hint">Обновлено: ${esc(fmtDate(table.updatedAt || new Date()))}</p>` : ''}
${adSlot('300×250')}
<h2>Ближайшие матчи</h2>${matchList(db, up)}
<h2>Результаты</h2>${matchList(db, res)}
${sc.length ? `<h2>Бомбардиры</h2><div class="table-wrap"><table class="standings"><thead><tr><th>#</th><th>Игрок</th><th>Команда</th><th>Голы</th></tr></thead><tbody>${sc.map((s, i) => `<tr><td class="rk">${i + 1}</td><td>${esc(s.player)}</td><td><a href="/team/${esc(s.team)}">${esc(db.teams.find(t => t.slug === s.team)?.name || s.team)}</a></td><td class="pts">${s.goals}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
  return layout(db, {
    title: `${league.name} (${country?.name || ''}) ${league.season} — таблица, расписание, результаты`,
    description: `Турнирная таблица и матчи ${league.name} (${country?.name || ''}) сезона ${league.season}: расписание, результаты, бомбардиры.`,
    canonical: `/league/${league.slug}`,
    content,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'SportsOrganization', name: `${league.name} (${country?.name || ''})`, sport: 'Football' }]
  });
}

function formBadges(db, tslug) {
  const f = form(tslug);
  if (!f.length) return '';
  return `<span class="formb">${f.map(x => `<i class="f-${x === 'В' ? 'w' : x === 'П' ? 'l' : 'd'}">${x}</i>`).join('')}</span>`;
}

export function matchPage(db, m) {
  const home = db.teams.find(t => t.slug === m.home);
  const away = db.teams.find(t => t.slug === m.away);
  const league = db.leagues.find(l => l.slug === m.league);
  const country = db.countries.find(c => c.slug === league?.country);
  const hn = home?.name || m.home, an = away?.name || m.away;
  const finished = m.status === 'finished';
  const scoreLine = finished || m.status === 'live' ? `${m.scoreHome ?? 0}:${m.scoreAway ?? 0}` : '—';
  const title = `${hn} — ${an}: матч ${fmtDate(m.date)}, ${league?.name || ''}`;
  const desc = `${hn} против ${an} — ${fmtDate(m.date)} в ${fmtTime(m.date)} (МСК), ${league?.name || ''} (${country?.name || ''}). ${finished ? `Счёт ${m.scoreHome}:${m.scoreAway}.` : 'Расписание, составы, история встреч.'}`;
  const hh = h2h(m.home, m.away).filter(x => x.id !== m.id).slice(0, 6);
  const sameDay = db.matches.filter(x => isoDay(x.date) === isoDay(m.date) && x.id !== m.id).slice(0, 6);
  const events = m.events || [];
  const content = `
${breadcrumbs([{ name: 'Главная', url: '/' }, { name: 'Страны', url: '/countries' }, { name: country?.name || '', url: `/country/${league?.country}` }, { name: league?.name || '', url: `/league/${league?.slug}` }, { name: `${hn} — ${an}` }])}
<article class="match-page">
  <p class="kicker">${esc(country?.name || '')} · ${esc(league?.name || '')} · ${esc(statusLabel(m))}</p>
  <h1>${esc(hn)} — ${esc(an)}</h1>
  <div class="scoreline">
    <div class="side">${badge(hn)}<b>${esc(hn)}</b>${formBadges(db, m.home)}</div>
    <div class="sc">${esc(scoreLine)}</div>
    <div class="side ta-r">${badge(an)}<b>${esc(an)}</b>${formBadges(db, m.away)}</div>
  </div>
  <div class="facts">
    <div><span>Дата</span><b>${esc(fmtDate(m.date))}, ${esc(fmtWeekday(m.date))}</b></div>
    <div><span>Начало</span><b>${esc(fmtTime(m.date))} МСК</b></div>
    <div><span>Стадион</span><b>${esc(m.venue || '—')}${m.city ? ', ' + esc(m.city) : ''}</b></div>
    <div><span>Статус</span><b>${esc(statusLabel(m))}</b></div>
  </div>
  ${adSlot('336×280')}
  ${events.length ? `<h2>Ход матча</h2><ol class="timeline">${events.map(e => `<li class="${e.side}"><b>${esc(e.min)}</b><span class="ev">${esc(e.type)}</span>${e.player ? `<span class="pl">${esc(e.player)}</span>` : ''}<span class="tm">${esc(db.teams.find(t => t.slug === (e.side === 'home' ? m.home : m.away))?.name || '')}</span></li>`).join('')}</ol>` : ''}
  ${m.preview ? `<h2>Анонс матча</h2><p>${esc(m.preview)}</p>` : ''}
  ${m.report ? `<h2>Отчёт о матче</h2><p>${esc(m.report)}</p>` : ''}
  <h2>История встреч</h2>
  ${hh.length ? matchList(db, hh) : '<p class="empty">Команды ещё не встречались в нашей базе.</p>'}
  <h2>Ссылки</h2>
  <ul class="links">
    <li><a href="/team/${esc(m.home)}">Все матчи ${esc(hn)}</a></li>
    <li><a href="/team/${esc(m.away)}">Все матчи ${esc(an)}</a></li>
    <li><a href="/league/${esc(m.league)}">Таблица ${esc(league?.name || '')}</a></li>
    <li><a href="/country/${esc(league?.country || '')}">Футбол ${esc(country?.name || '')}</a></li>
  </ul>
  ${sameDay.length ? `<h2>Другие матчи ${esc(fmtDate(m.date))}</h2>${matchList(db, sameDay, { showLeague: true })}` : ''}
</article>`;
  const jsonld = [{
    '@context': 'https://schema.org', '@type': 'SportsEvent',
    name: `${hn} — ${an}`, startDate: m.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    sport: 'Football',
    location: { '@type': 'Place', name: m.venue || 'Стадион', address: { '@type': 'PostalAddress', addressCountry: country?.name || '', addressLocality: m.city || '' } },
    competitor: [{ '@type': 'SportsTeam', name: hn }, { '@type': 'SportsTeam', name: an }],
    organizer: { '@type': 'Organization', name: league?.name || '' }
  }, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: db.settings.siteUrl + '/' },
      { '@type': 'ListItem', position: 2, name: country?.name || '', item: `${db.settings.siteUrl}/country/${league?.country}` },
      { '@type': 'ListItem', position: 3, name: league?.name || '', item: `${db.settings.siteUrl}/league/${m.league}` },
      { '@type': 'ListItem', position: 4, name: `${hn} — ${an}`, item: `${db.settings.siteUrl}/match/${m.slug}` }
    ]
  }];
  return layout(db, { title, description: desc, canonical: `/match/${m.slug}`, content, jsonld });
}

export function teamPage(db, team) {
  const ms = db.matches.filter(m => m.home === team.slug || m.away === team.slug).sort((a, b) => new Date(a.date) - new Date(b.date));
  const league = db.leagues.find(l => l.slug === team.league);
  const country = db.countries.find(c => c.slug === team.country);
  const content = `
${breadcrumbs([{ name: 'Главная', url: '/' }, { name: 'Страны', url: '/countries' }, { name: country?.name || '', url: `/country/${team.country}` }, { name: team.name }])}
<h1>${esc(team.name)}: матчи, результаты, форма</h1>
<p class="lead">${esc(country?.name || '')} · ${esc(league?.name || '')} · форма: ${formBadges(db, team.slug) || '—'}</p>
${matchList(db, ms)}`;
  return layout(db, {
    title: `${team.name}: календарь матчей и результатов`,
    description: `${team.name} (${country?.name || ''}, ${league?.name || ''}): расписание матчей, результаты, форма команды.`,
    canonical: `/team/${team.slug}`, content,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'SportsTeam', name: team.name, sport: 'Football' }]
  });
}

export function matchesPage(db, list, title, canonical, description) {
  const content = `${breadcrumbs([{ name: 'Главная', url: '/' }, { name: title }])}
<h1>${esc(title)}</h1><p class="lead">${esc(description)}</p>${matchList(db, list, { showLeague: true })}`;
  return layout(db, { title, description, canonical, content });
}

export function articlePage(db, a) {
  const content = `
${breadcrumbs([{ name: 'Главная', url: '/' }, { name: a.kind === 'page' ? 'Страница' : 'Новости', url: '/news' }, { name: a.title }])}
<article class="prose"><h1>${esc(a.title)}</h1><p class="kicker">${esc(fmtDate(a.date))}</p>
${a.body.split('\n').filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('')}</article>`;
  return layout(db, {
    title: a.title, description: a.excerpt || a.title, canonical: `/news/${a.slug}`, content,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, datePublished: a.date, inLanguage: 'ru-RU' }]
  });
}

export function newsPage(db) {
  const list = db.articles.filter(a => a.kind === 'news').sort((a, b) => b.date.localeCompare(a.date));
  const content = `${breadcrumbs([{ name: 'Главная', url: '/' }, { name: 'Новости' }])}
<h1>Новости и материалы</h1>
<div class="cards">${list.map(a => `<a class="card" href="/news/${esc(a.slug)}"><time>${esc(fmtDate(a.date))}</time><b>${esc(a.title)}</b><span>${esc(a.excerpt)}</span></a>`).join('') || '<p class="empty">Пока пусто.</p>'}</div>`;
  return layout(db, { title: 'Новости', description: 'Новости мирового футбола: анонсы и разборы матчей.', canonical: '/news', content });
}

export function notFound(db) {
  return layout(db, { title: 'Страница не найдена', noindex: true, content: '<h1>404</h1><p>Такой страницы нет. <a href="/">На главную</a></p>' });
}

/* ---------------- ADMIN ---------------- */

export function adminLogin(db, error = '') {
  return layout(db, {
    title: 'Вход в админку', noindex: true,
    content: `<div class="login"><h1>Вход в админку</h1>
      ${error ? `<p class="err">${esc(error)}</p>` : ''}
      <form method="post" action="/admin/login"><label>Пароль<input type="password" name="password" autofocus required></label><button class="btn" type="submit">Войти</button></form>
      <p class="hint">Пароль — переменная окружения ADMIN_PASSWORD. По умолчанию: admin123</p></div>`
  });
}

export function adminLayout(db, o) {
  const content = `
<div class="adminbar"><div><b>Админка</b> · <a href="/" target="_blank">Открыть сайт ↗</a></div>
<form method="post" action="/admin/logout"><button class="btn ghost" type="submit">Выйти</button></form></div>
<nav class="adminnav"><a href="/admin">Матчи</a><a href="/admin/leagues">Страны и лиги</a><a href="/admin/teams">Команды</a><a href="/admin/texts">Тексты</a><a href="/admin/settings">Настройки</a></nav>
${o.body}`;
  return layout(db, { title: o.title || 'Админка', noindex: true, content });
}

export function adminDashboard(db, flash = '') {
  const list = [...db.matches].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 120);
  const body = `<h1>Матчи <span class="count">${db.matches.length}</span></h1>
${flash ? `<p class="ok">${esc(flash)}</p>` : ''}
<p><a class="btn" href="/admin/match/new">+ Добавить матч</a></p>
<table class="tbl"><thead><tr><th>Дата</th><th>Матч</th><th>Лига</th><th>Статус</th><th>Счёт</th><th></th></tr></thead>
<tbody>${list.map(m => `<tr>
  <td>${esc(fmtDate(m.date))}<br><small>${esc(fmtTime(m.date))}</small></td>
  <td>${esc(db.teams.find(t => t.slug === m.home)?.name || m.home)} — ${esc(db.teams.find(t => t.slug === m.away)?.name || m.away)}<br><small><a href="/match/${esc(m.slug)}" target="_blank">/match/${esc(m.slug)}</a></small></td>
  <td><small>${esc(db.leagues.find(l => l.slug === m.league)?.name || m.league)}</small></td>
  <td>${esc(statusLabel(m))}</td>
  <td>${m.scoreHome != null ? `${m.scoreHome}:${m.scoreAway}` : '—'}</td>
  <td class="ta-r"><a href="/admin/match/${m.id}">Править</a></td></tr>`).join('')}</tbody></table>`;
  return adminLayout(db, { title: 'Матчи — админка', body });
}

export function adminMatchForm(db, m, flash = '') {
  const isNew = !m.id;
  const teamOpts = sel => db.leagues.map(l => `<optgroup label="${esc(db.countries.find(c => c.slug === l.country)?.name || '')} · ${esc(l.name)}">${db.teams.filter(t => t.league === l.slug).map(t => `<option value="${esc(t.slug)}" ${t.slug === sel ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</optgroup>`).join('');
  const leagueOpts = db.leagues.map(l => `<option value="${esc(l.slug)}" ${l.slug === m.league ? 'selected' : ''}>${esc(db.countries.find(c => c.slug === l.country)?.name || '')} · ${esc(l.name)}</option>`).join('');
  const eventsText = (m.events || []).map(e => `${e.min}|${e.type}|${e.side}|${e.player}`).join('\n');
  const body = `<h1>${isNew ? 'Новый матч' : 'Матч'}</h1>
${flash ? `<p class="ok">${esc(flash)}</p>` : ''}
<form method="post" action="${isNew ? '/admin/match/new' : `/admin/match/${m.id}`}" class="form">
  <div class="row">
    <label>Лига<select name="league" required>${leagueOpts}</select></label>
    <label>Дата и время<input type="datetime-local" name="date" value="${esc(toLocal(m.date))}" required></label>
    <label>Статус<select name="status">
      <option value="scheduled" ${m.status === 'scheduled' ? 'selected' : ''}>Не начался</option>
      <option value="live" ${m.status === 'live' ? 'selected' : ''}>Идёт</option>
      <option value="finished" ${m.status === 'finished' ? 'selected' : ''}>Завершён</option></select></label>
  </div>
  <div class="row">
    <label>Хозяева<select name="home" required>${teamOpts(m.home)}</select></label>
    <label>Гости<select name="away" required>${teamOpts(m.away)}</select></label>
  </div>
  <div class="row">
    <label>Голы хозяев<input type="number" name="scoreHome" min="0" value="${m.scoreHome ?? ''}"></label>
    <label>Голы гостей<input type="number" name="scoreAway" min="0" value="${m.scoreAway ?? ''}"></label>
    <label>Стадион<input name="venue" value="${esc(m.venue || '')}"></label>
    <label>Город<input name="city" value="${esc(m.city || '')}"></label>
  </div>
  <label>Ход матча — одна строка = одно событие: минута|тип|home/away|игрок
    <textarea name="eventsText" rows="8" placeholder="45'|Гол|home|Иванов">${esc(eventsText)}</textarea></label>
  <label>Анонс (ручной текст для уникальности)<textarea name="preview" rows="4">${esc(m.preview || '')}</textarea></label>
  <label>Отчёт о матче<textarea name="report" rows="4">${esc(m.report || '')}</textarea></label>
  <div class="actions"><button class="btn" type="submit">Сохранить</button><a class="btn ghost" href="/admin">Отмена</a></div>
</form>
${!isNew ? `<form method="post" action="/admin/match/${m.id}/delete" onsubmit="return confirm('Удалить матч?')"><button class="btn danger" type="submit">Удалить матч</button></form>` : ''}`;
  return adminLayout(db, { title: isNew ? 'Новый матч' : 'Матч', body });
}

function toLocal(d) {
  const p = parts(d, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function adminTexts(db, flash = '') {
  const list = [...db.articles].sort((a, b) => b.date.localeCompare(a.date));
  const body = `<h1>Тексты <span class="count">${list.length}</span></h1>
${flash ? `<p class="ok">${esc(flash)}</p>` : ''}
<p><a class="btn" href="/admin/text/new">+ Добавить текст</a></p>
<table class="tbl"><thead><tr><th>Дата</th><th>Заголовок</th><th>Тип</th><th></th></tr></thead><tbody>
${list.map(a => `<tr><td>${esc(a.date)}</td><td>${esc(a.title)}<br><small><a href="/news/${esc(a.slug)}" target="_blank">/news/${esc(a.slug)}</a></small></td><td>${a.kind === 'page' ? 'страница' : 'новость'}</td><td class="ta-r"><a href="/admin/text/${a.id}">Править</a></td></tr>`).join('')}
</tbody></table>`;
  return adminLayout(db, { title: 'Тексты — админка', body });
}

export function adminTextForm(db, a, flash = '') {
  const isNew = !a.id;
  const body = `<h1>${isNew ? 'Новый текст' : 'Текст'}</h1>
${flash ? `<p class="ok">${esc(flash)}</p>` : ''}
<form method="post" action="${isNew ? '/admin/text/new' : `/admin/text/${a.id}`}" class="form">
  <div class="row">
    <label>Заголовок<input name="title" value="${esc(a.title || '')}" required></label>
    <label>URL<input name="slug" value="${esc(a.slug || '')}"></label>
    <label>Тип<select name="kind"><option value="news" ${a.kind !== 'page' ? 'selected' : ''}>Новость</option><option value="page" ${a.kind === 'page' ? 'selected' : ''}>Страница</option></select></label>
    <label>Дата<input type="date" name="date" value="${esc(a.date || new Date().toISOString().slice(0, 10))}"></label>
  </div>
  <label>Краткое описание<textarea name="excerpt" rows="2">${esc(a.excerpt || '')}</textarea></label>
  <label>Текст<textarea name="body" rows="16">${esc(a.body || '')}</textarea></label>
  <div class="actions"><button class="btn" type="submit">Сохранить</button><a class="btn ghost" href="/admin/texts">Отмена</a></div>
</form>
${!isNew ? `<form method="post" action="/admin/text/${a.id}/delete" onsubmit="return confirm('Удалить?')"><button class="btn danger" type="submit">Удалить</button></form>` : ''}`;
  return adminLayout(db, { title: 'Текст', body });
}

export function adminTeams(db, flash = '') {
  const list = [...db.teams].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const body = `<h1>Команды <span class="count">${list.length}</span></h1>
${flash ? `<p class="ok">${esc(flash)}</p>` : ''}
<form method="post" action="/admin/team/new" class="form compact">
  <div class="row">
    <label>Название<input name="name" required></label>
    <label>Лига<select name="league">${db.leagues.map(l => `<option value="${esc(l.slug)}">${esc(db.countries.find(c => c.slug === l.country)?.name || '')} · ${esc(l.name)}</option>`).join('')}</select></label>
    <label>Город<input name="city"></label>
    <label>Стадион<input name="stadium"></label>
    <button class="btn" type="submit">Добавить</button>
  </div>
</form>
<table class="tbl"><thead><tr><th>Команда</th><th>Оригинал</th><th>Лига</th><th>URL</th><th></th></tr></thead><tbody>
${list.map(t => `<tr><td>${esc(t.name)}</td><td><small>${esc(t.original || '')}</small></td><td><small>${esc(t.league || '')}</small></td><td><small>/team/${esc(t.slug)}</small></td><td class="ta-r"><a href="/admin/team/${t.id}">Править</a></td></tr>`).join('')}
</tbody></table>`;
  return adminLayout(db, { title: 'Команды — админка', body });
}

export function adminTeamForm(db, t) {
  const body = `<h1>${esc(t.name)}</h1>
<form method="post" action="/admin/team/${t.id}" class="form">
  <div class="row">
    <label>Название (рус)<input name="name" value="${esc(t.name || '')}" required></label>
    <label>Город<input name="city" value="${esc(t.city || '')}"></label>
    <label>Стадион<input name="stadium" value="${esc(t.stadium || '')}"></label>
  </div>
  <div class="actions"><button class="btn" type="submit">Сохранить</button><a class="btn ghost" href="/admin/teams">Отмена</a></div>
</form>`;
  return adminLayout(db, { title: 'Команда', body });
}

export function adminLeagues(db, flash = '') {
  const body = `<h1>Страны и лиги</h1>
${flash ? `<p class="ok">${esc(flash)}</p>` : ''}
<div class="cols">
<form method="post" action="/admin/country" class="form compact">
  <h2>Добавить страну</h2>
  <div class="row"><label>Название<input name="name" required></label><label>Конфедерация<input name="confed" placeholder="КОНКАКАФ"></label></div>
  <div class="actions"><button class="btn" type="submit">Добавить страну</button></div>
</form>
<form method="post" action="/admin/league" class="form compact">
  <h2>Добавить лигу</h2>
  <div class="row">
    <label>Страна<select name="country">${db.countries.map(c => `<option value="${esc(c.slug)}">${esc(c.name)}</option>`).join('')}</select></label>
    <label>Название<input name="name" required placeholder="Примера А"></label>
    <label>Сезон<input name="season" value="2026"></label>
  </div>
  <div class="actions"><button class="btn" type="submit">Добавить лигу</button></div>
</form>
</div>
<table class="tbl"><thead><tr><th>Страна</th><th>Лига</th><th>Сезон</th><th>Матчей</th><th></th></tr></thead><tbody>
${db.leagues.map(l => `<tr><td>${esc(db.countries.find(c => c.slug === l.country)?.name || l.country)}</td><td>${esc(l.name)}</td><td>${esc(l.season)}</td><td>${db.matches.filter(m => m.league === l.slug).length}</td><td class="ta-r"><a href="/league/${esc(l.slug)}" target="_blank">Открыть</a></td></tr>`).join('')}
</tbody></table>`;
  return adminLayout(db, { title: 'Страны и лиги', body });
}

export function adminSettings(db, flash = '') {
  const s = db.settings;
  const body = `<h1>Настройки</h1>
${flash ? `<p class="ok">${esc(flash)}</p>` : ''}
<form method="post" action="/admin/settings" class="form">
  <div class="row"><label>Название сайта<input name="siteName" value="${esc(s.siteName)}"></label><label>Подзаголовок<input name="tagline" value="${esc(s.tagline)}"></label></div>
  <div class="row"><label>Домен<input name="siteUrl" value="${esc(s.siteUrl)}"></label><label>E-mail<input name="email" value="${esc(s.email || '')}"></label></div>
  <div class="actions"><button class="btn" type="submit">Сохранить</button></div>
</form>`;
  return adminLayout(db, { title: 'Настройки', body });
}
