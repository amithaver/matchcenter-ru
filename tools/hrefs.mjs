const base='https://live-football-dd6b.onrender.com';
const h=await (await fetch(base+'/',{signal:AbortSignal.timeout(60000)})).text();
const hrefs=[...h.matchAll(/href="(\/[^"#]*)"/g)].map(m=>m[1]);
const uniq=[...new Set(hrefs)].filter(x=>!x.startsWith('/admin')&&!x.endsWith('.xml')&&!x.endsWith('.css')&&!x.endsWith('.svg'));
console.log('ссылок:', uniq.length);
for (const u of uniq.slice(0,8)) {
  try { const r=await fetch(base+u,{signal:AbortSignal.timeout(30000)}); console.log(r.status, u); } catch(e){ console.log('ERR', u); }
}
