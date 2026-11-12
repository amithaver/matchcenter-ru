for (const u of ['http://204.168.177.174/','http://204.168.177.174/admin']) {
  try { const t0=Date.now(); const r=await fetch(u,{signal:AbortSignal.timeout(45000)}); const t=await r.text(); console.log(u, r.status, (Date.now()-t0)+'ms', 'len', t.length, /Live Football|Payload|Create First/i.test(t)?'OK':''); }
  catch(e){ console.log(u,'ERR',e.message); }
}
