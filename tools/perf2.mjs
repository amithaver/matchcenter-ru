const base='https://live-football-dd6b.onrender.com';
const u='/match/hetafe-sevil-ya-2026-11-01';
for (let i=0;i<3;i++){ const t0=Date.now(); const r=await fetch(base+u,{signal:AbortSignal.timeout(60000)}); await r.text(); console.log('hit',i,r.status,(Date.now()-t0)+'ms'); }
