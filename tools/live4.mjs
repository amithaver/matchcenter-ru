const base='https://live-football-static.onrender.com';
for (const p of ['/','/matches','/countries','/country/cuba','/league/eng-1','/team/liverpul','/match/brayton-vatford-2026-11-11','/sitemap.xml']) {
  try { const t0=Date.now(); const r=await fetch(base+p,{signal:AbortSignal.timeout(30000)}); await r.text(); console.log(r.status, (Date.now()-t0)+'ms', p); }
  catch(e){ console.log('ERR', p, e.message); }
}
