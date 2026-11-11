const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const TZ = 'Europe/Moscow';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function parts(d, opts) {
  const fmt = new Intl.DateTimeFormat('ru-RU', { timeZone: TZ, hourCycle: 'h23', ...opts });
  const o = {};
  for (const p of fmt.formatToParts(new Date(d))) o[p.type] = p.value;
  return o;
}

export function fmtDate(d) {
  const p = parts(d, { day: 'numeric', month: 'numeric', year: 'numeric' });
  return `${p.day} ${MONTHS[Number(p.month) - 1]} ${p.year}`;
}
export function fmtTime(d) {
  const p = parts(d, { hour: '2-digit', minute: '2-digit' });
  return `${p.hour}:${p.minute}`;
}
export function fmtWeekday(d) {
  return parts(d, { weekday: 'long' }).weekday;
}
export function isoDay(d) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d));
}

export function statusLabel(m) {
  if (m.status === 'finished') return 'Завершён';
  if (m.status === 'live') return 'Идёт';
  return 'Не начался';
}

function layout(db, o) {
  const s = db.settings;
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
    <a class="brand" href="/">${esc(s.siteName)}<span>${esc(s.league)}</span></a>
    <nav>
      <a href="/matches">Матчи</a>
      <a href="/teams">Команды</a>
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
    <p>${esc(s.siteName)} — расписание и результаты ${esc(s.league)}. Ставок и букмекерской рекламы нет.</p>
    <p>© 2026 · <a href="/news/o-saite">О сайте</a> · <a href="/sitemap.xml">Карта сайта</a> · <a href="/admin">Управление</a></p>
  </div>
</footer>
</body>
</html>`;
}

export function matchCard(db, m) {
  const p = parts(m.date, { day: 'numeric', month: 'numeric' });
  const live = m.status === 'live';
  const finished = m.status === 'finished';
  const score = (live || finished) && m.scoreHome != null ? `${m.scoreHome}:${m.scoreAway}` : fmtTime(m.date);
  return `<a class="match ${live ? 'is-live' : ''}" href="/match/${esc(m.slug)}">
    <div class="md"><b>${p.day} ${MONTHS[Number(p.month) - 1].slice(0, 3)}</b><span>${fmtWeekday(m.date).slice(0, 2)} · ${fmtTime(m.date)}</span></div>
    <div class="mt">
      <div class="t">${esc(db.teams.find(t => t.slug === m.home)?.name || m.home)}</div>
      <div class="th">—</div>
      <div class="t ta-r">${esc(db.teams.find(t => t.slug === m.away)?.name || m.away)}</div>
    </div>
    <div class="ms ${finished ? 'fin' : ''}">${score}</div>
  </a>`;
}

export function matchList(db, list) {
  if (!list.length) return '<p class="empty">Матчей нет. Добавьте их в админке.</p>';
  return `<div class="matches">${list.map(m => matchCard(db, m)).join('')}</div>`;
}

function breadcrumbs(items) {
  return `<nav class="crumbs" aria-label="Хлебные крошки">${items.map((it, i) => i === items.length - 1
    ? `<span>${esc(it.name)}</span>`
    : `<a href="${esc(it.url)}">${esc(it.name)}</a>`).join('<i>/</i>')}</nav>`;
}

export function home(db) {
  const now = new Date();
  const matches = [...db.matches].sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcoming = matches.filter(m => new Date(m.date) >= now).slice(0, 6);
  const recent = matches.filter(m => m.status === 'finished').slice(-4).reverse();
  const news = [...db.articles].filter(a => a.kind === 'news').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const content = `
<section class="hero">
  <h1>Матчи ${esc(db.settings.league)}: расписание, результаты, дата и время</h1>
  <p class="lead">Ближайшие игры, счёт и анонсы. Все матчи — с датой и временем начала по Москве. Без ставок и коэффициентов.</p>
</section>
<section>
  <div class="sec-h"><h2>Ближайшие матчи</h2><a href="/matches">Все матчи →</a></div>
  ${matchList(db, upcoming)}
</section>
${recent.length ? `<section><div class="sec-h"><h2>Последние результаты</h2></div>${matchList(db, recent)}</section>` : ''}
<section>
  <div class="sec-h"><h2>Новости</h2><a href="/news">Все материалы →</a></div>
  <div class="cards">${news.map(a => `<a class="card" href="/news/${esc(a.slug)}"><time>${esc(fmtDate(a.date))}</time><b>${esc(a.title)}</b><span>${esc(a.excerpt)}</span></a>`).join('')}</div>
</section>`;
  return layout(db, {
    title: `Матчи ${db.settings.league} — расписание и результаты`,
    description: `Расписание матчей ${db.settings.league} с датой и временем начала, результаты игр, анонсы. ${db.settings.siteName}.`,
    canonical: '/',
    content,
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'WebSite',
      name: db.settings.siteName, url: db.settings.siteUrl,
      inLanguage: 'ru-RU',
      potentialAction: { '@type': 'SearchAction', target: `${db.settings.siteUrl}/matches?q={search_term_string}`, 'query-input': 'required name=search_term_string' }
    }]
  });
}

export function matchesPage(db, list, title, canonical, description) {
  const content = `
${breadcrumbs([{ name: 'Главная', url: '/' }, { name: title }])}
<h1>${esc(title)}</h1>
<p class="lead">${esc(description)}</p>
${matchList(db, list)}`;
  return layout(db, { title, description, canonical, content });
}

export function matchPage(db, m) {
  const home = db.teams.find(t => t.slug === m.home);
  const away = db.teams.find(t => t.slug === m.away);
  const hn = home?.name || m.home, an = away?.name || m.away;
  const d = new Date(m.date);
  const finished = m.status === 'finished';
  const scoreLine = finished && m.scoreHome != null ? `${m.scoreHome}:${m.scoreAway}` : '—';
  const title = `${hn} — ${an}: матч ${fmtDate(m.date)}, ${db.settings.league}`;
  const desc = `${hn} против ${an} — ${fmtDate(m.date)} в ${fmtTime(m.date)} (МСК), ${m.tour} тур ${db.settings.league}. ${finished ? `Счёт ${m.scoreHome}:${m.scoreAway}.` : 'Расписание, стадион, анонс матча.'}`;
  const sameDay = db.matches.filter(x => isoDay(x.date) === isoDay(m.date) && x.id !== m.id);
  const content = `
${breadcrumbs([{ name: 'Главная', url: '/' }, { name: 'Матчи', url: '/matches' }, { name: `${hn} — ${an}` }])}
<article class="match-page">
  <p class="kicker">${esc(db.settings.league)} · ${m.tour} тур · ${esc(statusLabel(m))}</p>
  <h1>${esc(hn)} — ${esc(an)}</h1>
  <div class="scoreline">
    <div class="side"><b>${esc(hn)}</b><span>${esc(home?.city || '')}</span></div>
    <div class="sc">${esc(scoreLine)}</div>
    <div class="side ta-r"><b>${esc(an)}</b><span>${esc(away?.city || '')}</span></div>
  </div>
  <div class="facts">
    <div><span>Дата</span><b>${esc(fmtDate(m.date))}, ${esc(fmtWeekday(m.date))}</b></div>
    <div><span>Начало</span><b>${esc(fmtTime(m.date))} МСК</b></div>
    <div><span>Стадион</span><b>${esc(m.venue || home?.stadium || '—')}</b></div>
    <div><span>Статус</span><b>${esc(statusLabel(m))}</b></div>
  </div>
  ${m.preview ? `<h2>Анонс матча</h2><p>${esc(m.preview)}</p>` : ''}
  ${m.report ? `<h2>Отчёт о матче</h2><p>${esc(m.report)}</p>` : ''}
  <h2>Команды</h2>
  <ul class="links">
    <li><a href="/team/${esc(m.home)}">Все матчи ${esc(hn)}</a></li>
    <li><a href="/team/${esc(m.away)}">Все матчи ${esc(an)}</a></li>
  </ul>
  ${sameDay.length ? `<h2>Другие матчи ${esc(fmtDate(m.date))}</h2>${matchList(db, sameDay)}` : ''}
</article>`;
  const jsonld = [{
    '@context': 'https://schema.org', '@type': 'SportsEvent',
    name: `${hn} — ${an}`,
    startDate: m.date,
    eventStatus: finished ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    sport: 'Football',
    location: { '@type': 'Place', name: m.venue || home?.stadium || 'Стадион', address: { '@type': 'PostalAddress', addressCountry: 'RU', addressLocality: home?.city || '' } },
    competitor: [
      { '@type': 'SportsTeam', name: hn, sport: 'Football' },
      { '@type': 'SportsTeam', name: an, sport: 'Football' }
    ],
    ...(finished && m.scoreHome != null ? {
      result: { '@type': 'Thing', name: `${m.scoreHome}:${m.scoreAway}` }
    } : {}),
    organizer: { '@type': 'Organization', name: db.settings.league, url: db.settings.siteUrl }
  }, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: db.settings.siteUrl + '/' },
      { '@type': 'ListItem', position: 2, name: 'Матчи', item: db.settings.siteUrl + '/matches' },
      { '@type': 'ListItem', position: 3, name: `${hn} — ${an}`, item: `${db.settings.siteUrl}/match/${m.slug}` }
    ]
  }];
  return layout(db, { title, description: desc, canonical: `/match/${m.slug}`, content, jsonld });
}

export function teamPage(db, team) {
  const list = [...db.matches].filter(m => m.home === team.slug || m.away === team.slug).sort((a, b) => new Date(a.date) - new Date(b.date));
  const title = `${team.name}: матчи, расписание и результаты`;
  const desc = `${team.name} (${team.city}): календарь матчей ${db.settings.league} с датой и временем, результаты игр, стадион ${team.stadium}.`;
  const content = `
${breadcrumbs([{ name: 'Главная', url: '/' }, { name: 'Команды', url: '/teams' }, { name: team.name }])}
<h1>${esc(team.name)}</h1>
<p class="lead">${esc(team.city)} · ${esc(team.stadium)} · матчи ${esc(db.settings.league)}</p>
${matchList(db, list)}`;
  return layout(db, {
    title, description: desc, canonical: `/team/${team.slug}`, content,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'SportsTeam', name: team.name, sport: 'Football', location: { '@type': 'Place', name: team.city } }]
  });
}

export function teamsPage(db) {
  const content = `
${breadcrumbs([{ name: 'Главная', url: '/' }, { name: 'Команды' }])}
<h1>Команды ${esc(db.settings.league)}</h1>
<div class="grid">${db.teams.map(t => `<a class="tile" href="/team/${esc(t.slug)}"><b>${esc(t.name)}</b><span>${esc(t.city)}</span></a>`).join('')}</div>`;
  return layout(db, { title: `Команды ${db.settings.league}`, description: `Все команды ${db.settings.league}: расписание и результаты матчей.`, canonical: '/teams', content });
}

export function articlePage(db, a) {
  const content = `
${breadcrumbs([{ name: 'Главная', url: '/' }, { name: a.kind === 'page' ? 'Страница' : 'Новости', url: '/news' }, { name: a.title }])}
<article class="prose">
  <h1>${esc(a.title)}</h1>
  <p class="kicker">${esc(fmtDate(a.date))}</p>
  ${a.body.split('\n').filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('')}
</article>`;
  return layout(db, {
    title: a.title, description: a.excerpt || a.title, canonical: `/news/${a.slug}`, content,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, datePublished: a.date, inLanguage: 'ru-RU', author: { '@type': 'Organization', name: db.settings.siteName } }]
  });
}

export function newsPage(db) {
  const list = [...db.articles].filter(a => a.kind === 'news').sort((a, b) => b.date.localeCompare(a.date));
  const content = `
${breadcrumbs([{ name: 'Главная', url: '/' }, { name: 'Новости' }])}
<h1>Новости и материалы</h1>
<div class="cards">${list.map(a => `<a class="card" href="/news/${esc(a.slug)}"><time>${esc(fmtDate(a.date))}</time><b>${esc(a.title)}</b><span>${esc(a.excerpt)}</span></a>`).join('')}</div>`;
  return layout(db, { title: 'Новости', description: `Новости ${db.settings.league}: анонсы и отчёты о матчах.`, canonical: '/news', content });
}

export function notFound(db) {
  return layout(db, {
    title: 'Страница не найдена', description: 'Страница не найдена', noindex: true,
    content: `<h1>404</h1><p>Такой страницы нет. <a href="/">На главную</a></p>`
  });
}

/* ---------- ADMIN ---------- */

export function adminLogin(db, error = '') {
  return layout(db, {
    title: 'Вход в админку', description: 'Вход в админку', noindex: true,
    content: `<div class="login">
      <h1>Вход в админку</h1>
      ${error ? `<p class="err">${esc(error)}</p>` : ''}
      <form method="post" action="/admin/login">
        <label>Пароль<input type="password" name="password" autofocus required></label>
        <button class="btn" type="submit">Войти</button>
      </form>
      <p class="hint">Пароль задаётся переменной окружения ADMIN_PASSWORD. По умолчанию: admin123</p>
    </div>`
  });
}

export function adminLayout(db, o) {
  const content = `
<div class="adminbar">
  <div><b>Админка</b> · <a href="/" target="_blank">Открыть сайт ↗</a></div>
  <form method="post" action="/admin/logout"><button class="btn ghost" type="submit">Выйти</button></form>
</div>
<nav class="adminnav">
  <a href="/admin">Матчи</a><a href="/admin/texts">Тексты</a><a href="/admin/teams">Команды</a><a href="/admin/settings">Настройки</a>
</nav>
${o.body}`;
  return layout(db, { title: o.title || 'Админка', description: 'Админка', noindex: true, content });
}

export function adminDashboard(db, flash = '') {
  const list = [...db.matches].sort((a, b) => new Date(b.date) - new Date(a.date));
  const body = `
<h1>Матчи <span class="count">${list.length}</span></h1>
${flash ? `<p class="ok">${esc(flash)}</p>` : ''}
<p><a class="btn" href="/admin/match/new">+ Добавить матч</a></p>
<table class="tbl">
<thead><tr><th>Дата</th><th>Матч</th><th>Тур</th><th>Статус</th><th>Счёт</th><th></th></tr></thead>
<tbody>${list.map(m => `<tr>
  <td>${esc(fmtDate(m.date))}<br><small>${esc(fmtTime(m.date))}</small></td>
  <td>${esc(db.teams.find(t => t.slug === m.home)?.name || m.home)} — ${esc(db.teams.find(t => t.slug === m.away)?.name || m.away)}<br><small><a href="/match/${esc(m.slug)}" target="_blank">/match/${esc(m.slug)}</a></small></td>
  <td>${m.tour}</td>
  <td>${esc(statusLabel(m))}</td>
  <td>${m.scoreHome != null ? `${m.scoreHome}:${m.scoreAway}` : '—'}</td>
  <td class="ta-r"><a href="/admin/match/${m.id}">Править</a></td>
</tr>`).join('')}</tbody></table>`;
  return adminLayout(db, { title: 'Матчи — админка', body });
}

export function adminMatchForm(db, m, flash = '') {
  const isNew = !m.id;
  const v = m;
  const opt = (slug, cur) => db.teams.map(t => `<option value="${esc(t.slug)}" ${t.slug === cur ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  const body = `
<h1>${isNew ? 'Новый матч' : 'Матч'}</h1>
${flash ? `<p class="ok">${esc(flash)}</p>` : ''}
<form method="post" action="${isNew ? '/admin/match/new' : `/admin/match/${m.id}`}" class="form">
  <div class="row">
    <label>Дата и время<input type="datetime-local" name="date" value="${esc(toLocal(v.date))}" required></label>
    <label>Тур<input type="number" name="tour" value="${esc(v.tour ?? 1)}" min="1"></label>
    <label>Статус<select name="status">
      <option value="scheduled" ${v.status === 'scheduled' ? 'selected' : ''}>Не начался</option>
      <option value="live" ${v.status === 'live' ? 'selected' : ''}>Идёт</option>
      <option value="finished" ${v.status === 'finished' ? 'selected' : ''}>Завершён</option>
    </select></label>
  </div>
  <div class="row">
    <label>Хозяева<select name="home" required>${opt(v.home, v.home)}</select></label>
    <label>Гости<select name="away" required>${opt(v.away, v.away)}</select></label>
  </div>
  <div class="row">
    <label>Голы хозяев<input type="number" name="scoreHome" min="0" value="${v.scoreHome ?? ''}"></label>
    <label>Голы гостей<input type="number" name="scoreAway" min="0" value="${v.scoreAway ?? ''}"></label>
    <label>Стадион<input name="venue" value="${esc(v.venue || '')}"></label>
  </div>
  <label>Анонс матча (выводится на странице матча)<textarea name="preview" rows="5">${esc(v.preview || '')}</textarea></label>
  <label>Отчёт о матче<textarea name="report" rows="5">${esc(v.report || '')}</textarea></label>
  <div class="actions">
    <button class="btn" type="submit">Сохранить</button>
    <a class="btn ghost" href="/admin">Отмена</a>
  </div>
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
  const body = `
<h1>Тексты <span class="count">${list.length}</span></h1>
${flash ? `<p class="ok">${esc(flash)}</p>` : ''}
<p><a class="btn" href="/admin/text/new">+ Добавить текст</a></p>
<table class="tbl"><thead><tr><th>Дата</th><th>Заголовок</th><th>Тип</th><th></th></tr></thead>
<tbody>${list.map(a => `<tr><td>${esc(a.date)}</td><td>${esc(a.title)}<br><small><a href="/news/${esc(a.slug)}" target="_blank">/news/${esc(a.slug)}</a></small></td><td>${a.kind === 'page' ? 'страница' : 'новость'}</td><td class="ta-r"><a href="/admin/text/${a.id}">Править</a></td></tr>`).join('')}</tbody></table>`;
  return adminLayout(db, { title: 'Тексты — админка', body });
}

export function adminTextForm(db, a, flash = '') {
  const isNew = !a.id;
  const body = `
<h1>${isNew ? 'Новый текст' : 'Текст'}</h1>
${flash ? `<p class="ok">${esc(flash)}</p>` : ''}
<form method="post" action="${isNew ? '/admin/text/new' : `/admin/text/${a.id}`}" class="form">
  <div class="row">
    <label>Заголовок<input name="title" value="${esc(a.title || '')}" required></label>
    <label>URL (латиницей)<input name="slug" value="${esc(a.slug || '')}" placeholder="avto"></label>
    <label>Тип<select name="kind">
      <option value="news" ${a.kind !== 'page' ? 'selected' : ''}>Новость</option>
      <option value="page" ${a.kind === 'page' ? 'selected' : ''}>Страница</option>
    </select></label>
    <label>Дата<input type="date" name="date" value="${esc(a.date || new Date().toISOString().slice(0, 10))}"></label>
  </div>
  <label>Краткое описание (для поиска)<textarea name="excerpt" rows="2">${esc(a.excerpt || '')}</textarea></label>
  <label>Текст<textarea name="body" rows="16">${esc(a.body || '')}</textarea></label>
  <div class="actions">
    <button class="btn" type="submit">Сохранить</button>
    <a class="btn ghost" href="/admin/texts">Отмена</a>
  </div>
</form>
${!isNew ? `<form method="post" action="/admin/text/${a.id}/delete" onsubmit="return confirm('Удалить текст?')"><button class="btn danger" type="submit">Удалить</button></form>` : ''}`;
  return adminLayout(db, { title: isNew ? 'Новый текст' : 'Текст', body });
}

export function adminTeams(db, flash = '') {
  const body = `
<h1>Команды <span class="count">${db.teams.length}</span></h1>
${flash ? `<p class="ok">${esc(flash)}</p>` : ''}
<form method="post" action="/admin/team/new" class="form compact">
  <div class="row"><label>Название<input name="name" required></label><label>Город<input name="city"></label><label>Стадион<input name="stadium"></label><button class="btn" type="submit">Добавить</button></div>
</form>
<table class="tbl"><thead><tr><th>Команда</th><th>Город</th><th>Стадион</th><th>URL</th><th></th></tr></thead>
<tbody>${db.teams.map(t => `<tr><td>${esc(t.name)}</td><td>${esc(t.city)}</td><td>${esc(t.stadium)}</td><td><small>/team/${esc(t.slug)}</small></td><td class="ta-r"><a href="/admin/team/${t.id}">Править</a></td></tr>`).join('')}</tbody></table>`;
  return adminLayout(db, { title: 'Команды — админка', body });
}

export function adminTeamForm(db, t) {
  const isNew = !t.id;
  const body = `
<h1>${isNew ? 'Новая команда' : esc(t.name)}</h1>
<form method="post" action="${isNew ? '/admin/team/new' : `/admin/team/${t.id}`}" class="form">
  <div class="row">
    <label>Название<input name="name" value="${esc(t.name || '')}" required></label>
    <label>URL<input name="slug" value="${esc(t.slug || '')}"></label>
    <label>Город<input name="city" value="${esc(t.city || '')}"></label>
    <label>Стадион<input name="stadium" value="${esc(t.stadium || '')}"></label>
  </div>
  <div class="actions"><button class="btn" type="submit">Сохранить</button><a class="btn ghost" href="/admin/teams">Отмена</a></div>
</form>`;
  return adminLayout(db, { title: 'Команда', body });
}

export function adminSettings(db, flash = '') {
  const s = db.settings;
  const body = `
<h1>Настройки</h1>
${flash ? `<p class="ok">${esc(flash)}</p>` : ''}
<form method="post" action="/admin/settings" class="form">
  <div class="row">
    <label>Название сайта<input name="siteName" value="${esc(s.siteName)}"></label>
    <label>Подзаголовок<input name="tagline" value="${esc(s.tagline)}"></label>
  </div>
  <div class="row">
    <label>Домен (для canonical и sitemap)<input name="siteUrl" value="${esc(s.siteUrl)}" placeholder="https://example.ru"></label>
    <label>Лига<input name="league" value="${esc(s.league)}"></label>
    <label>E-mail<input name="email" value="${esc(s.email)}"></label>
  </div>
  <div class="actions"><button class="btn" type="submit">Сохранить</button></div>
</form>
<p class="hint">После публикации укажите реальный домен — от него зависят canonical, sitemap и JSON-LD.</p>`;
  return adminLayout(db, { title: 'Настройки', body });
}
