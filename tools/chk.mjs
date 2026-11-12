for (const u of ['http://204.168.177.174/','http://204.168.177.174/admin','http://204.168.177.174/api/users/me']) {
  try { const t0=Date.now(); const r=await fetch(u,{signal:AbortSignal.timeout(40000)}); const t=await r.text(); console.log(u.replace('http://204.168.177.174',''), r.status, (Date.now()-t0)+'ms', t.length); }
  catch(e){ console.log(u,'ERR',e.message); }
}
