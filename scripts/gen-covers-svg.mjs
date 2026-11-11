// Локальные обложки матчей: SVG без внешних сервисов (не зависит от квот).
import fs from 'node:fs';
const FILE = 'data/store.json';
const OUT = 'public/covers';
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const LIMIT = Number(process.env.LIMIT || 40);
fs.mkdirSync(OUT, { recursive: true });

const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const league = s => db.leagues.find(l => l.slug === s);
const team = s => db.teams.find(t => t.slug === s);

const targets = db.matches
  .filter(m => m.status !== 'finished' && !m.cover)
  .sort((a, b) => new Date(a.date) - new Date(b.date))
  .slice(0, LIMIT);

let n = 0;
for (const m of targets) {
  const h1 = hash(m.home), h2 = hash(m.away);
  const c1 = `hsl(${h1} 55% 42%)`, c2 = `hsl(${h2} 55% 38%)`;
  const l = league(m.league);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="v" cx="50%" cy="30%" r="75%">
      <stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".72"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#g)"/>
  <g fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="3">
    <rect x="60" y="50" width="1080" height="575" rx="6"/>
    <line x1="600" y1="50" x2="600" y2="625"/>
    <circle cx="600" cy="337" r="96"/>
    <rect x="60" y="212" width="128" height="250"/>
    <rect x="1012" y="212" width="128" height="250"/>
  </g>
  <g fill="#ffffff" fill-opacity=".9">
    <circle cx="600" cy="337" r="7"/>
    <circle cx="188" cy="337" r="5" fill-opacity=".6"/>
    <circle cx="1012" cy="337" r="5" fill-opacity=".6"/>
  </g>
  <rect width="1200" height="675" fill="url(#v)"/>
  <text x="60" y="600" font-family="Inter,system-ui,sans-serif" font-size="34" font-weight="700"
        fill="#ffffff" fill-opacity=".92">${escapeXml(team(m.home)?.name || m.home)} — ${escapeXml(team(m.away)?.name || m.away)}</text>
  <text x="60" y="640" font-family="Inter,system-ui,sans-serif" font-size="22"
        fill="#ffffff" fill-opacity=".7">${escapeXml(l?.name || '')}</text>
</svg>`;
  fs.writeFileSync(`${OUT}/${m.slug}.svg`, svg);
  m.cover = `/covers/${m.slug}.svg`;
  n++;
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
console.log(`обложек создано: ${n}`);
