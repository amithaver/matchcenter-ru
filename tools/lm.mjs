try {
  const r=await fetch('http://127.0.0.1:3000/match/brighton-hove-albion-vatford-2026-11-11',{signal:AbortSignal.timeout(30000)});
  console.log('local match ->', r.status, (await r.text()).length);
} catch(e){ console.log('ERR', e.message); }
