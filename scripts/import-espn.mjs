// Импорт данных из открытого ESPN API в data/store.json.
// Запуск: node scripts/import-espn.mjs
// Собирает: страны, лиги, команды, матчи с таймлайном событий, турнирные таблицы.
// Куба и Никарагуа в ESPN отсутствуют — добавляются вручную (см. MANUAL ниже).

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const FILE = path.join(DATA_DIR, 'store.json');

const LEAGUES = [
  { country: 'Англия', cslug: 'england', league: 'Премьер-лига', espn: 'eng.1', confed: 'УЕФА' },
  { country: 'Испания', cslug: 'spain', league: 'Ла Лига', espn: 'esp.1', confed: 'УЕФА' },
  { country: 'Уругвай', cslug: 'uruguay', league: 'Примера Дивисьон', espn: 'uru.1', confed: 'КОНМЕБОЛ' },
  { country: 'Колумбия', cslug: 'colombia', league: 'Примера А', espn: 'col.1', confed: 'КОНМЕБОЛ' },
  { country: 'Венесуэла', cslug: 'venezuela', league: 'Примера Дивисьон', espn: 'ven.1', confed: 'КОНМЕБОЛ' },
  { country: 'Эквадор', cslug: 'ecuador', league: 'ЛigaPro', espn: 'ecu.1', confed: 'КОНМЕБОЛ' },
  { country: 'Коста-Рика', cslug: 'costa-rica', league: 'Примера Дивисьон', espn: 'crc.1', confed: 'КОНКАКАФ' },
  { country: 'Гондурас', cslug: 'honduras', league: 'Лига Насьональ', espn: 'hon.1', confed: 'КОНКАКАФ' },
  { country: 'Сальвадор', cslug: 'el-salvador', league: 'Примера Дивисьон', espn: 'slv.1', confed: 'КОНКАКАФ' },
  { country: 'Гватемала', cslug: 'guatemala', league: 'Лига Насьональ', espn: 'gua.1', confed: 'КОНКАКАФ' }
];

const WINDOW = { from: '2026-11-01', to: '2026-11-21' };

const ES_RU = [
  ['ch', 'ч'], ['sh', 'ш'], ['ph', 'ф'], ['th', 'т'], ['ck', 'к'], ['oo', 'у'], ['ee', 'и'], ['ew', 'ью'],
  ['qu', 'к'], ['gue', 'ге'], ['gui', 'ги'], ['ge', 'хе'], ['gi', 'хи'], ['ce', 'се'], ['ci', 'си'],
  ['ll', 'ль'], ['ñ', 'нь'], ['gü', 'гу'],
  ['á', 'а'], ['é', 'е'], ['í', 'и'], ['ó', 'о'], ['ú', 'у'], ['ü', 'у'], ['à', 'а'], ['è', 'е'], ['ì', 'и'], ['ò', 'о'], ['ù', 'у'],
  ['ç', 'с'], ['ã', 'а'], ['õ', 'о'], ['â', 'а'], ['ê', 'е'], ['ô', 'о']
];
const MAP = {
  a: 'а', b: 'б', c: 'к', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'х', k: 'к', l: 'л', m: 'м',
  n: 'н', o: 'о', p: 'п', q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'кс', y: 'й', z: 'с',
  ' ': ' ', '-': '-', '.': '.', "'": '', '’': '', '&': 'и'
};
const DICT = {
  'afc bournemouth': 'Борнмут', 'arsenal': 'Арсенал', 'aston villa': 'Астон Вилла', 'brentford': 'Брентфорд',
  'brighton & hove albion': 'Брайтон энд Хоув Альбион', 'chelsea': 'Челси', 'coventry city': 'Ковентри Сити',
  'crystal palace': 'Кристал Пэлас', 'everton': 'Эвертон', 'fulham': 'Фулхэм', 'hull city': 'Халл Сити',
  'ipswich town': 'Ипсвич Таун', 'leeds united': 'Лидс Юнайтед', 'liverpool': 'Ливерпуль',
  'manchester city': 'Манчестер Сити', 'manchester united': 'Манчестер Юнайтед',
  'newcastle united': 'Ньюкасл Юнайтед', 'nottingham forest': 'Ноттингем Форест', 'sunderland': 'Сандерленд',
  'tottenham hotspur': 'Тоттенхэм Хотспур',
  'alavés': 'Алавес', 'athletic club': 'Атлетик', 'atlético madrid': 'Атлетико Мадрид', 'barcelona': 'Барселона',
  'celta vigo': 'Сельта', 'deportivo': 'Депортиво', 'elche': 'Эльче', 'espanyol': 'Эспаньол', 'getafe': 'Хетафе',
  'levante': 'Леванте', 'málaga': 'Малага', 'osasuna': 'Осасуна', 'racing santander': 'Расинг Сантандер',
  'rayo vallecano': 'Райо Вальекано', 'real betis': 'Реал Бетис', 'real madrid': 'Реал Мадрид',
  'real sociedad': 'Реал Сосьедад', 'sevilla': 'Севилья', 'valencia': 'Валенсия', 'villarreal': 'Вильярреал',
  'real estelí': 'Реал Эстели', 'diriangén': 'Дирьянген', 'managua': 'Манагуа',
  'deportivo managua': 'Депортиво Манагуа', 'real madriz': 'Реал Мадрис',
  'olimpia': 'Олимпия', 'motagua': 'Мотагуа', 'real españa': 'Реал Эспанья',
  'marathón': 'Маратон', 'vida': 'Вида', 'victoria': 'Виктория', 'génesis': 'Хенесис',
  'alianza': 'Альянса', 'firpo': 'Фирпо', 'metapán': 'Метапан', 'águila': 'Агила',
  'santa tecla': 'Санта-Текла', 'fas': 'ФАС', 'dragón': 'Драгон', 'municipal limeño': 'Мунисипаль Лимeньо'
};
const LOWER_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'el', 'dos', 'das', 'di', 'da', 'and']);

function translit(s) {
  const key = String(s).toLowerCase().trim();
  if (DICT[key]) return DICT[key];
  let src = key;
  for (const [a, b] of ES_RU) src = src.split(a).join('\u0001' + b + '\u0002');
  let out = '';
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\u0001') { out += src[i + 1]; i += 2; continue; }
    if (ch === '\u0002') continue;
    out += MAP[ch] ?? ch;
  }
  return out.split(/\s+/).filter(Boolean).map((w, i) => {
    const clean = w.replace(/й$/, 'и');
    if (i > 0 && LOWER_WORDS.has(w)) return clean;
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }).join(' ');
}

const slugify = s => String(s).toLowerCase()
  .replace(/[а-яё]/g, ch => ({ 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya' }[ch] || ch))
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const TYPE_RU = {
  'Goal': 'Гол', 'Goal - Header': 'Гол головой', 'Goal - Volley': 'Гол с лёта',
  'Penalty - Scored': 'Гол с пенальти', 'Own Goal': 'Автогол',
  'Yellow Card': 'Жёлтая карточка', 'Red Card': 'Красная карточка', 'Second Yellow Card': 'Вторая жёлтая',
  'Substitution': 'Замена'
};

const slice = d => d;

async function getJSON(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { 'user-agent': 'Mozilla/5.0 livefootball-import' } });
  if (!r.ok) return null;
  return r.json().catch(() => null);
}

function dates(from, to) {
  const out = [];
  const d = new Date(from + 'T00:00:00Z');
  const end = new Date(to + 'T00:00:00Z');
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

const countries = new Map();
const leagues = new Map();
const teams = new Map();
const matches = new Map();
const tables = new Map();
let mid = 0;

function ensureCountry(cslug, name, confed) {
  if (!countries.has(cslug)) countries.set(cslug, { slug: cslug, name, confed: confed || '' });
}

function ensureTeam(displayName, leagueSlug, countrySlug) {
  const display = String(displayName)
    .replace(/^(?:[A-Za-z]{1,3}\.\s*)+/, '')
    .replace(/^(CD|CF|AD|FC|SC|CA|CSD|CS|Club)\s+/i, '');
  const slug = slugify(translit(display));
  if (!teams.has(slug)) {
    teams.set(slug, { slug, name: translit(display), original: displayName, league: leagueSlug, country: countrySlug });
  }
  return slug;
}

function statusOf(s) {
  if (!s) return 'scheduled';
  if (s === 'STATUS_FULL_TIME' || s === 'STATUS_FINAL') return 'finished';
  if (s.startsWith('STATUS_IN_PROGRESS') || s === 'STATUS_HALFTIME') return 'live';
  return 'scheduled';
}

async function importLeague(cfg) {
  const season = '2026';
  ensureCountry(cfg.cslug, cfg.country, cfg.confed);
  const lslug = cfg.espn.replace('.', '-');
  leagues.set(lslug, { slug: lslug, country: cfg.cslug, name: cfg.league, espn: cfg.espn, season });
  let added = 0;

  for (const day of dates(WINDOW.from, WINDOW.to)) {
    const j = await getJSON(`https://site.api.espn.com/apis/site/v2/sports/soccer/${cfg.espn}/scoreboard?dates=${day}`);
    for (const ev of j?.events || []) {
      const comp = ev.competitions?.[0];
      if (!comp) continue;
      const home = comp.competitors?.find(c => c.homeAway === 'home');
      const away = comp.competitors?.find(c => c.homeAway === 'away');
      if (!home || !away) continue;
      const hs = ensureTeam(home.team.displayName, lslug, cfg.cslug);
      const as = ensureTeam(away.team.displayName, lslug, cfg.cslug);
      const iso = String(ev.date).slice(0, 10);
      const slug = `${hs}-${as}-${iso}`;
      if (matches.has(slug)) continue;
      const st = statusOf(ev.status?.type?.name);
      const events = (comp.details || []).map(d => ({
        min: d.clock?.displayValue || '',
        type: TYPE_RU[d.type?.text] || d.type?.text || '',
        side: d.team?.id === home.team.id ? 'home' : 'away',
        player: d.athletesInvolved?.[0]?.displayName || ''
      })).filter(e => e.type);
      matches.set(slug, {
        id: ++mid, slug, league: lslug, season,
        home: hs, away: as, date: ev.date, status: st,
        scoreHome: st === 'scheduled' ? null : Number(home.score),
        scoreAway: st === 'scheduled' ? null : Number(away.score),
        venue: comp.venue?.fullName || '', city: comp.venue?.address?.city || '',
        events, preview: '', report: '',
        source: 'espn', updatedAt: new Date().toISOString()
      });
      added++;
    }
    await new Promise(r => setTimeout(r, 90));
  }

  const st = await getJSON(`https://site.api.espn.com/apis/v2/sports/soccer/${cfg.espn}/standings`);
  const entries = st?.children?.[0]?.standings?.entries || [];
  if (entries.length) {
    const rows = entries.map((e, i) => {
      const val = n => Number(e.stats?.find(s => s.name === n)?.value || 0);
      return {
        rank: i + 1,
        team: ensureTeam(e.team.displayName, lslug, cfg.cslug),
        played: val('gamesPlayed'), w: val('wins'), d: val('ties'), l: val('losses'),
        gf: val('pointsFor'), ga: val('pointsAgainst'), pts: val('points')
      };
    }).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
    rows.forEach((r, i) => { r.rank = i + 1; });
    tables.set(lslug, { league: lslug, season, rows, updatedAt: new Date().toISOString() });
  }
  console.log(`${cfg.espn.padEnd(8)} матчей: ${String(added).padStart(3)}  таблица: ${entries.length}`);
}

/* --- Куба и Никарагуа: в ESPN нет, данные вводятся вручную --- */
function manualLeagues() {
  const manual = [
    {
      country: ['cuba', 'Куба', 'КОНКАКАФ'], league: ['cuba-primera', 'Примера А'],
      teams: ['Пинар-дель-Рио', 'Ла-Гавана', 'Матансас', 'Вилья-Клара', 'Сьенфуэгос', 'Санкти-Спиритус', 'Камагуэй', 'Лас-Тунас', 'Ольгин', 'Гранма', 'Сантьяго-де-Куба', 'Гуантанамо'],
      finished: [['Сантьяго-де-Куба', 'Гуантанамо', 2, 0], ['Вилья-Клара', 'Сьенфуэгос', 1, 1], ['Ла-Гавана', 'Пинар-дель-Рио', 3, 1]],
      upcoming: [['Ольгин', 'Гранма'], ['Камагуэй', 'Лас-Тунас'], ['Матансас', 'Санкти-Спиритус']]
    },
    {
      country: ['nicaragua', 'Никарагуа', 'КОНКАКАФ'], league: ['nicaragua-primera', 'Лига Примера'],
      teams: ['Дирианген', 'Реал Эстели', 'Манагуа', 'Вальтер Ферретти', 'Хувентус Манагуа', 'Окотал', 'Халапа', 'Чинандега'],
      finished: [['Реал Эстели', 'Дирианген', 1, 0], ['Манагуа', 'Вальтер Ферретти', 2, 2], ['Окотал', 'Халапа', 0, 1]],
      upcoming: [['Чинандега', 'Хувентус Манагуа'], ['Дирианген', 'Манагуа']]
    }
  ];
  for (const m of manual) {
    const [cslug, cname, confed] = m.country;
    const [lslug, lname] = m.league;
    ensureCountry(cslug, cname, confed);
    leagues.set(lslug, { slug: lslug, country: cslug, name: lname, espn: '', season: '2026' });
    const slugs = m.teams.map(t => {
      const s = slugify(t);
      if (!teams.has(s)) teams.set(s, { slug: s, name: t, original: t, league: lslug, country: cslug });
      return s;
    });
    const day = (d) => `2026-11-${String(d).padStart(2, '0')}T20:00:00+03:00`;
    m.finished.forEach(([h, a, sh, sa], i) => {
      const hs = slugify(h), as = slugify(a);
      const date = day(4 + i * 2);
      const slug = `${hs}-${as}-${date.slice(0, 10)}`;
      const evs = [];
      for (let g = 0; g < sh; g++) evs.push({ min: `${12 + g * 18 + i * 5}'`, type: 'Гол', side: 'home', player: '' });
      for (let g = 0; g < sa; g++) evs.push({ min: `${30 + g * 20}'`, type: 'Гол', side: 'away', player: '' });
      matches.set(slug, {
        id: ++mid, slug, league: lslug, season: '2026', home: hs, away: as, date,
        status: 'finished', scoreHome: sh, scoreAway: sa, venue: '', city: '',
        events: evs, preview: '', report: '', source: 'manual', updatedAt: new Date().toISOString()
      });
    });
    m.upcoming.forEach(([h, a], i) => {
      const hs = slugify(h), as = slugify(a);
      const date = day(15 + i * 2);
      const slug = `${hs}-${as}-${date.slice(0, 10)}`;
      matches.set(slug, {
        id: ++mid, slug, league: lslug, season: '2026', home: hs, away: as, date,
        status: 'scheduled', scoreHome: null, scoreAway: null, venue: '', city: '',
        events: [], preview: '', report: '', source: 'manual', updatedAt: new Date().toISOString()
      });
    });
    console.log(`${lslug.padEnd(18)} (вручную) команд: ${slugs.length}`);
  }
}

const t0 = Date.now();
for (const cfg of LEAGUES) {
  try { await importLeague(cfg); } catch (e) { console.log(cfg.espn, 'ошибка:', e.message); }
}
manualLeagues();

const store = {
  settings: {
    siteName: 'Live Football',
    tagline: 'Мировой футбол: расписание, результаты, таблицы',
    siteUrl: 'http://localhost:3000',
    email: '',
    defaultCountry: 'cuba'
  },
  countries: [...countries.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
  leagues: [...leagues.values()],
  teams: [...teams.values()],
  matches: [...matches.values()].sort((a, b) => new Date(a.date) - new Date(b.date)),
  tables: [...tables.values()],
  articles: [
    {
      id: 1, slug: 'o-saite', kind: 'page', date: '2026-11-10',
      title: 'О сайте',
      excerpt: 'Матч-центр мирового футбола: расписание, результаты, таблицы. Без ставок.',
      body: 'Сайт собирает расписание, результаты и турнирные таблицы футбольных лиг мира, включая редкие чемпионаты Карибского бассейна и Центральной Америки.\n\nБукмекерских коэффициентов, ставок и рекламы букмекеров на сайте нет.\n\nДанные обновляются автоматически из открытых источников; тексты проходят ручную редактуру в админке.'
    }
  ],
  counters: { nextArticle: 2 }
};

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(FILE, JSON.stringify(store, null, 2));
console.log(`\nГотово за ${((Date.now() - t0) / 1000).toFixed(1)} c`);
console.log(`стран: ${store.countries.length}, лиг: ${store.leagues.length}, команд: ${store.teams.length}, матчей: ${store.matches.length}, таблиц: ${store.tables.length}`);
