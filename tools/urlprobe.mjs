for (const u of ['https://live-football-static.onrender.com','https://live-football-static-1.onrender.com']) {
  try { const t0=Date.now(); const r=await fetch(u+'/',{signal:AbortSignal.timeout(30000)}); const t=await r.text(); console.log(u, r.status, (Date.now()-t0)+'ms', t.includes('Live Football')?'OK':''); }
  catch(e){ console.log(u,'ERR',e.message); }
}
