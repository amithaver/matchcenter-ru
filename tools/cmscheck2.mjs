try {
  const t0=Date.now();
  const r=await fetch('https://live-football-cms.onrender.com/admin',{signal:AbortSignal.timeout(110000)});
  const t=await r.text();
  console.log('admin', r.status, ((Date.now()-t0)/1000).toFixed(1)+'s', 'len', t.length);
  console.log('payload markers:', /Payload|Create First User|login|email/i.test(t));
} catch(e){ console.log('ERR', e.message); }
