const base = 'http://127.0.0.1:3001'
const creds = { email: 'admin@livefootball.site', password: 'LFadmin2026x7', name: 'Admin' }

const reg = await fetch(`${base}/api/users/first-register`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds)
})
console.log('register:', reg.status, (await reg.text()).slice(0, 160))

const login = await fetch(`${base}/api/users/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: creds.email, password: creds.password })
})
const body = await login.text()
console.log('login:', login.status, body.slice(0, 120))
