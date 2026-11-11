const base='http://127.0.0.1:3000';
for (const p of ['/match/brayton-vatford-2026-11-11','/match/brayton-vatford-2026-11-11','/league/eng-1']) {
  try { const t0=Date.now(); const r=await fetch(base+p,{signal:AbortSignal.timeout(20000)}); await r.text(); console.log(p,'->',r.status,(Date.now()-t0)+'ms'); }
  catch(e){ console.log(p,'ERR',e.message); }
}
