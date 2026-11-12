try {
  const r = await fetch('http://204.168.177.174/', { signal: AbortSignal.timeout(30000) });
  const t = await r.text();
  console.log('status', r.status, 'len', t.length, 'brand:', /Live Football/i.test(t));
} catch(e) { console.log('ERR', e.message); }
