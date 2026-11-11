// Генерация уникальных анонсов из фактов (Gemini). Ключ — только в переменной окружения.
import fs from 'node:fs';

const KEY = process.env.GKEY;
if (!KEY) { console.error('нет GKEY'); process.exit(1); }
const FILE = 'data/store.json';
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const LIMIT = Number(process.env.LIMIT || 8);

const team = s => db.teams.find(t => t.slug === s);
const league = s => db.leagues.find(l => l.slug === s);
const country = s => db.countries.find(c => c.slug === s);
const tableRow = (l, t) => db.tables.find(x => x.league === l)?.rows.find(r => r.team === t);

function formOf(t) {
  return db.matches
    .filter(m => m.status === 'finished' && (m.home === t || m.away === t))
    .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-5)
    .map(m => {
      const home = m.home === t;
      const gf = home ? m.scoreHome : m.scoreAway;
      const ga = home ? m.scoreAway : m.scoreHome;
      return gf > ga ? 'В' : gf < ga ? 'П' : 'Н';
    }).join('');
}

async function gen(facts) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.MODEL || `gemini-3.8-flash`}:generateContent?key=${KEY}`;
  const body = {
    contents: [{ parts: [{ text:
`Напиши анонс футбольного матча на русском, 55–75 слов, 2 абзаца.
Правила: только факты из данных ниже, ничего не придумывай, без коэффициентов, ставок и прогнозов на деньги, без воды и штампов вроде "в захватывающем поединке".
Данные:
${facts}` }]}],
    generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
  };
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 200));
  return (j.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
}

const targets = db.matches
  .filter(m => m.status !== 'finished' && !m.preview && new Date(m.date) > new Date())
  .sort((a, b) => new Date(a.date) - new Date(b.date))
  .slice(0, LIMIT);

for (const m of targets) {
  const h = team(m.home), a = team(m.away), l = league(m.league), c = country(l?.country);
  const rh = tableRow(m.league, m.home), ra = tableRow(m.league, m.away);
  const facts = [
    `Турнир: ${l?.name || ''} (${c?.name || ''})`,
    `Дата: ${new Date(m.date).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} МСК`,
    `Матч: ${h?.name} — ${a?.name}`,
    `Стадион: ${m.venue || 'не указан'}${m.city ? ', ' + m.city : ''}`,
    rh ? `Позиция ${h?.name} в таблице: ${rh.rank}, очков ${rh.pts}, игр ${rh.played}` : `Позиции ${h?.name} в таблице нет`,
    ra ? `Позиция ${a?.name} в таблице: ${ra.rank}, очков ${ra.pts}, игр ${ra.played}` : `Позиции ${a?.name} в таблице нет`,
    `Форма ${h?.name}: ${formOf(m.home) || 'нет данных'}`,
    `Форма ${a?.name}: ${formOf(m.away) || 'нет данных'}`
  ].join('\n');
  try {
    const text = await gen(facts);
    m.preview = text;
    m.updatedAt = new Date().toISOString();
    console.log(`${m.slug}: ${text.slice(0, 80)}...`);
  } catch (e) {
    console.log(`${m.slug}: ОШИБКА ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 1200));
}

fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
console.log(`готово, обработано ${targets.length}`);
