for (const u of ['https://live-football-cms.onrender.com/','https://live-football-cms.onrender.com/admin']) {
  try { const t0=Date.now(); const r=await fetch(u,{signal:AbortSignal.timeout(60000)}); const t=await r.text(); console.log(u, r.status, (Date.now()-t0)+'ms', 'len', t.length, /Create First User|Payload|login/i.test(t)?'PAYLOAD':'' ); }
  catch(e){ console.log(u,'ERR',e.message); }
}
