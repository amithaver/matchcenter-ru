// Обложки матчей через Pollinations (без ключа). Пишет файлы и поле cover в store.
import fs from 'node:fs';
const FILE = 'data/store.json';
const OUT = 'public/covers';
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const LIMIT = Number(process.env.LIMIT || 10);
fs.mkdirSync(OUT, { recursive: true });

const team = s => db.teams.find(t => t.slug === s);
const league = s => db.leagues.find(l => l.slug === s);
const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 99991; return h; };

const targets = db.matches
  .filter(m => m.status !== 'finished' && !m.cover && new Date(m.date) > new Date())
  .sort((a, b) => new Date(a.date) - new Date(b.date))
  .slice(0, LIMIT);

let ok = 0;
for (const m of targets) {
  const l = league(m.league);
  const prompt = `football match poster, ${l?.name || 'football'}, night stadium floodlights, green pitch, dramatic minimal composition, dark emerald palette, cinematic, no text, no logos, no people faces`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=675&nologo=true&seed=${hash(m.slug)}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(90000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 8000) throw new Error('too small');
    fs.writeFileSync(`${OUT}/${m.slug}.jpg`, buf);
    m.cover = `/covers/${m.slug}.jpg`;
    ok++;
    console.log(`${m.slug}: ${Math.round(buf.length / 1024)} КБ`);
  } catch (e) {
    console.log(`${m.slug}: ОШИБКА ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 800));
}
fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
console.log(`готово: ${ok}/${targets.length}`);
