const base = 'https://live-football-dd6b.onrender.com';
const r = await fetch(base + '/matches', { signal: AbortSignal.timeout(90000) });
const t = await r.text();
console.log('matches', r.status, '| блоков', (t.match(/class="match /g)||[]).length, '|', Math.round(t.length/1024)+'КБ');
const c = await fetch(base + '/countries', { signal: AbortSignal.timeout(60000) });
const ct = await c.text();
console.log('countries', c.status, '| флагов', (ct.match(/class="flag"/g)||[]).length);
