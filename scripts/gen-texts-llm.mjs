// Анонсы матчей через OpenAI-совместимый прокси (FreeLLM). Ключ только из env.
import fs from 'node:fs';
const BASE = process.env.LLM_BASE || 'http://127.0.0.1:31415/v1';
const KEY = process.env.LLM_KEY;
const MODEL = process.env.LLM_MODEL || 'auto';
if (!KEY) { console.error('нет LLM_KEY'); process.exit(1); }

const FILE = 'data/store.json';
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const LIMIT = Number(process.env.LIMIT || 20);

const team = s => db.teams.find(t => t.slug === s);
const league = s => db.leagues.find(l => l.slug === s);
const country = s => db.countries.find(c => c.slug === s);
const row = (l, t) => db.tables.find(x => x.league === l)?.rows.find(r => r.team === t);
const formOf = t => db.matches
  .filter(m => m.status === 'finished' && (m.home === t || m.away === t))
  .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-5)
  .map(m => {
    const home = m.home === t;
    const gf = home ? m.scoreHome : m.scoreAway, ga = home ? m.scoreAway : m.scoreHome;
    return gf > ga ? 'В' : gf < ga ? 'П' : 'Н';
  }).join('');

async function gen(text) {
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: text }],
      temperature: 0.7,
      max_tokens: 450
    }),
    signal: AbortSignal.timeout(120000)
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 160));
  return (j.choices?.[0]?.message?.content || '').trim().replace(/^["«]|["»]$/g, '');
}

const TOP = new Set(['england','spain','italy','germany','france','russia','ukraine','portugal','netherlands','turkey','belgium']);
const lgCountry = m => db.leagues.find(l => l.slug === m.league)?.country || '';
const targets = db.matches
  .filter(m => m.status !== 'finished' && !m.preview && new Date(m.date) > new Date())
  .sort((a, b) => {
    const pa = TOP.has(lgCountry(a)) ? 0 : 1, pb = TOP.has(lgCountry(b)) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return new Date(a.date) - new Date(b.date);
  })
  .slice(0, LIMIT);

let ok = 0, fail = 0;
for (const m of targets) {
  const h = team(m.home), a = team(m.away), l = league(m.league), c = country(l?.country);
  const rh = row(m.league, m.home), ra = row(m.league, m.away);
  const hh = db.matches
    .filter(x => x.status === 'finished' && ((x.home === m.home && x.away === m.away) || (x.home === m.away && x.away === m.home)))
    .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-3)
    .map(x => `${x.scoreHome}:${x.scoreAway}`);
  const facts = [
    `Турнир: ${l?.name || ''} (${c?.name || ''})`,
    `Дата: ${new Date(m.date).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} МСК`,
    `Матч: ${h?.name} — ${a?.name}`,
    `Стадион: ${m.venue || 'не указан'}${m.city ? ', ' + m.city : ''}`,
    rh ? `${h?.name}: ${rh.rank}-е место, ${rh.pts} очков в ${rh.played} играх` : '',
    ra ? `${a?.name}: ${ra.rank}-е место, ${ra.pts} очков в ${ra.played} играх` : '',
    `Форма ${h?.name}: ${formOf(m.home) || 'нет данных'}`,
    `Форма ${a?.name}: ${formOf(m.away) || 'нет данных'}`,
    hh.length ? `Очные встречи (последние): ${hh.join(', ')}` : 'Очных встреч в базе нет'
  ].filter(Boolean).join('\n');

  try {
    const text = await gen(`Ты спортивный редактор. Напиши анонс матча на русском: 55–75 слов, два коротких абзаца.
Только факты из данных, ничего не выдумывай. Без ставок, коэффициентов и прогнозов на деньги. Без штампов и воды. Отвечай ТОЛЬКО текстом анонса, без пояснений и рассуждений.
Данные:\n${facts}`);
    if (text.length < 60) throw new Error('слишком короткий');
    if (/[A-Za-z]{4,}\s+[A-Za-z]{4,}\s+[A-Za-z]{4,}/.test(text)) throw new Error('латиница/рассуждения в ответе');
    m.preview = text;
    m.updatedAt = new Date().toISOString();
    ok++;
    console.log(`OK ${m.slug}: ${text.slice(0, 70)}…`);
  } catch (e) {
    fail++;
    console.log(`FAIL ${m.slug}: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 700));
}

fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
console.log(`готово: ok=${ok} fail=${fail}`);
