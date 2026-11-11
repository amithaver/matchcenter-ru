const base='https://live-football-dd6b.onrender.com';
const paths=['/','/matches','/countries','/country/cuba','/league/eng-1','/match/hetafe-sevil-ya-2026-11-01','/team/liverpool','/news/o-saite','/admin'];
for (const p of paths) {
  try { const t0=Date.now(); const r=await fetch(base+p,{signal:AbortSignal.timeout(60000)}); console.log(p,'->',r.status,((Date.now()-t0)/1000).toFixed(1)+'s'); }
  catch(e){ console.log(p,'-> ERR',e.message); }
}
