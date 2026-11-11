import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const FILE = path.join(DATA_DIR, 'store.json');

function seed() {
  const teams = [
    ['zenit', 'Зенит', 'Санкт-Петербург', 'Газпром Арена'],
    ['spartak', 'Спартак', 'Москва', 'Лукойл Арена'],
    ['cska', 'ЦСКА', 'Москва', 'ВЭБ Арена'],
    ['dynamo-moscow', 'Динамо', 'Москва', 'ВТБ Арена'],
    ['lokomotiv', 'Локомотив', 'Москва', 'РЖД Арена'],
    ['krasnodar', 'Краснодар', 'Краснодар', 'Краснодар'],
    ['rostov', 'Ростов', 'Ростов-на-Дону', 'Ростов Арена'],
    ['rubin', 'Рубин', 'Казань', 'Ак Барс Арена'],
    ['akhmat', 'Ахмат', 'Грозный', 'Ахмат Арена'],
    ['krylia', 'Крылья Советов', 'Самара', 'Солидарность Самара Арена'],
    ['baltika', 'Балтика', 'Калининград', 'Ростех Арена'],
    ['akron', 'Акрон', 'Тольятти', 'Солидарность Самара Арена'],
    ['dynamo-makhachkala', 'Динамо Махачкала', 'Махачкала', 'Анжи Арена'],
    ['pari-nn', 'Пари НН', 'Нижний Новгород', 'Нижний Новгород'],
    ['orenburg', 'Оренбург', 'Оренбург', 'Газовик'],
    ['sochi', 'Сочи', 'Сочи', 'Фишт']
  ].map(([slug, name, city, stadium], i) => ({ id: i + 1, slug, name, city, stadium }));

  const T = Object.fromEntries(teams.map(t => [t.slug, t]));
  let mid = 0;
  const match = (home, away, date, tour, status = 'scheduled', sh = null, sa = null) => {
    mid += 1;
    const iso = String(date).slice(0, 10);
    return {
      id: mid,
      slug: `${home}-${away}-${iso}`,
      home, away, date, tour,
      status,
      scoreHome: sh, scoreAway: sa,
      venue: T[home].stadium,
      preview: '',
      report: '',
      updatedAt: new Date().toISOString()
    };
  };

  const matches = [
    match('zenit', 'spartak', '2026-11-07T19:00:00+03:00', 15, 'finished', 2, 1),
    match('cska', 'krasnodar', '2026-11-08T17:30:00+03:00', 15, 'finished', 1, 1),
    match('dynamo-moscow', 'lokomotiv', '2026-11-09T19:45:00+03:00', 15, 'finished', 0, 2),
    match('rostov', 'rubin', '2026-11-14T16:00:00+03:00', 16),
    match('akhmat', 'krylia', '2026-11-14T18:30:00+03:00', 16),
    match('baltika', 'akron', '2026-11-15T14:00:00+03:00', 16),
    match('zenit', 'cska', '2026-11-15T18:30:00+03:00', 16),
    match('spartak', 'dynamo-moscow', '2026-11-16T19:00:00+03:00', 16),
    match('krasnodar', 'lokomotiv', '2026-11-16T19:30:00+03:00', 16),
    match('pari-nn', 'orenburg', '2026-11-17T17:00:00+03:00', 16),
    match('sochi', 'dynamo-makhachkala', '2026-11-17T19:00:00+03:00', 16),
    match('rubin', 'spartak', '2026-11-21T16:00:00+03:00', 17),
    match('cska', 'rostov', '2026-11-22T18:00:00+03:00', 17),
    match('lokomotiv', 'zenit', '2026-11-22T19:30:00+03:00', 17)
  ];

  matches[0].report = 'Зенит обыграл Спартак в центральном матче тура. Хозяева открыли счёт в первом тайме, гости сравняли после перерыва, но победу петербуржцы вырвали на последних минутах.';
  matches[3].preview = '«Ростов» принимает «Рубин»: обе команды ведут борьбу за место в верхней половине таблицы. Матч 16-го тура РПЛ пройдёт на «Ростов Арене».';
  matches[6].preview = '«Зенит» и ЦСКА встречаются в Петербурге. Для обеих команд это ключевой матч в борьбе за высокие места по итогам первого круга.';

  const articles = [
    {
      id: 1, slug: 'rpl-16-tur-anons',
      title: '16-й тур РПЛ: расписание матчей и время начала',
      excerpt: 'Все матчи 16-го тура РПЛ: даты, время начала по Москве, пары команд и стадионы.',
      body: 'В 16-м туре РПЛ пройдут восемь матчей. Тур открывается 14 ноября играми в Ростове и Грозном, центральные встречи — 15 ноября: «Зенит» против ЦСКА и «Спартак» против «Динамо».\n\nВсе матчи тура доступны в разделе «Матчи» с датой, временем начала по Москве и стадионом.',
      date: '2026-11-10', kind: 'news'
    },
    {
      id: 2, slug: 'o-saite',
      title: 'О сайте',
      excerpt: 'Что публикует сайт: матч-центр РПЛ, анонсы и отчёты без ставок.',
      body: 'Сайт публикует расписание, результаты и текстовые материалы о матчах РПЛ. Букмекерских ставок, коэффициентов и рекламы букмекеров на сайте нет.\n\nМатериалы проходят ручную редактуру в админке.',
      date: '2026-11-10', kind: 'page'
    },
    {
      id: 3, slug: 'kontakty',
      title: 'Контакты',
      excerpt: 'Связаться с редакцией сайта.',
      body: 'По вопросам сотрудничества и исправления ошибок пишите на почту редакции.',
      date: '2026-11-10', kind: 'page'
    }
  ];

  return {
    settings: {
      siteName: 'Футбол России',
      tagline: 'Матч-центр РПЛ: расписание, результаты, анонсы',
      siteUrl: 'http://localhost:3000',
      league: 'РПЛ',
      region: 'Россия',
      email: 'info@example.ru'
    },
    teams, matches, articles,
    counters: { nextTeam: 17, nextMatch: mid + 1, nextArticle: 4 }
  };
}

let db = null;

export function load() {
  if (db) return db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) {
    db = seed();
    save();
    return db;
  }
  db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  return db;
}

export function save() {
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, FILE);
}

export const get = () => load();

export function resetDemo() {
  db = seed();
  save();
  return db;
}

export function findTeam(slug) { return load().teams.find(t => t.slug === slug); }
export function findMatch(slug) { return load().matches.find(m => m.slug === slug); }
export function findArticle(slug) { return load().articles.find(a => a.slug === slug); }

export function teamName(slug) {
  const t = findTeam(slug);
  return t ? t.name : slug;
}

export function matchesSorted() {
  return [...load().matches].sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function matchSlug(home, away, date) {
  return `${home}-${away}-${normDate(date).slice(0, 10)}`;
}

// Приводит дату из формы (datetime-local, без зоны) к ISO с московским смещением.
export function normDate(s) {
  const v = String(s || '').trim();
  if (!v) return new Date().toISOString();
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(v)) return v;
  return v.length === 16 ? `${v}:00+03:00` : `${v}+03:00`;
}

export function upsertMatch(data) {
  const d = load();
  const slug = matchSlug(data.home, data.away, data.date);
  if (data.id) {
    const m = d.matches.find(x => x.id === Number(data.id));
    if (!m) return null;
    Object.assign(m, {
      home: data.home, away: data.away, date: normDate(data.date), tour: Number(data.tour) || m.tour,
      status: data.status, scoreHome: data.scoreHome === '' ? null : Number(data.scoreHome),
      scoreAway: data.scoreAway === '' ? null : Number(data.scoreAway),
      venue: data.venue, preview: data.preview ?? m.preview, report: data.report ?? m.report,
      slug, updatedAt: new Date().toISOString()
    });
    save();
    return m;
  }
  const m = {
    id: d.counters.nextMatch++, slug,
    home: data.home, away: data.away, date: normDate(data.date), tour: Number(data.tour) || 1,
    status: data.status || 'scheduled',
    scoreHome: data.scoreHome === '' || data.scoreHome == null ? null : Number(data.scoreHome),
    scoreAway: data.scoreAway === '' || data.scoreAway == null ? null : Number(data.scoreAway),
    venue: data.venue || '', preview: data.preview || '', report: data.report || '',
    updatedAt: new Date().toISOString()
  };
  d.matches.push(m);
  save();
  return m;
}

export function deleteMatch(id) {
  const d = load();
  const i = d.matches.findIndex(m => m.id === Number(id));
  if (i < 0) return false;
  d.matches.splice(i, 1);
  save();
  return true;
}

export function upsertArticle(data) {
  const d = load();
  const slug = String(data.slug || '').trim() || slugify(data.title);
  if (data.id) {
    const a = d.articles.find(x => x.id === Number(data.id));
    if (!a) return null;
    Object.assign(a, {
      slug, title: data.title, excerpt: data.excerpt, body: data.body,
      kind: data.kind === 'page' ? 'page' : 'news',
      date: data.date || a.date
    });
    save();
    return a;
  }
  const a = {
    id: d.counters.nextArticle++, slug, title: data.title, excerpt: data.excerpt || '',
    body: data.body || '', kind: data.kind === 'page' ? 'page' : 'news',
    date: data.date || new Date().toISOString().slice(0, 10)
  };
  d.articles.push(a);
  save();
  return a;
}

export function deleteArticle(id) {
  const d = load();
  const i = d.articles.findIndex(a => a.id === Number(id));
  if (i < 0) return false;
  d.articles.splice(i, 1);
  save();
  return true;
}

export function upsertTeam(data) {
  const d = load();
  if (data.id) {
    const t = d.teams.find(x => x.id === Number(data.id));
    if (!t) return null;
    Object.assign(t, {
      name: data.name, city: data.city, stadium: data.stadium,
      slug: data.slug ? slugify(data.slug) : t.slug
    });
    save();
    return t;
  }
  const t = {
    id: d.counters.nextTeam++,
    slug: slugify(data.slug || data.name),
    name: data.name, city: data.city || '', stadium: data.stadium || ''
  };
  d.teams.push(t);
  save();
  return t;
}

export function updateSettings(patch) {
  const d = load();
  d.settings = { ...d.settings, ...patch };
  save();
  return d.settings;
}

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[а-яё]/g, ch => ({ 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya' }[ch] || ch))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
