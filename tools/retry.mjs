const base='https://live-football-dd6b.onrender.com';
for (const p of ['/match/huventus-ol-lyonnes-2026-11-11','/match/londrina-nautiko-2026-11-11']) {
  for (let i=0;i<3;i++) {
    try { const r=await fetch(base+p,{signal:AbortSignal.timeout(60000)}); console.log(p.slice(0,28),'try',i,r.status); if(r.status===200) break; }
    catch(e){ console.log(p.slice(0,28),'try',i,'ERR',e.message); }
    await new Promise(r=>setTimeout(r,4000));
  }
}
