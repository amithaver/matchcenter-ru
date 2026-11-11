const KEY = 'freellmapi-323990b52501908a7e0aa1a14100cb478d9bd29beaeed37e';
try {
  const r = await fetch('http://127.0.0.1:31415/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: 'auto:fast', messages: [{ role: 'user', content: 'Ответь одним словом: работает' }] }),
    signal: AbortSignal.timeout(60000)
  });
  const j = await r.json();
  console.log('status', r.status);
  console.log(JSON.stringify(j).slice(0, 300));
} catch (e) { console.log('ERR', e.message); }
