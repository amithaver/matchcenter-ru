import fs from 'node:fs';
const dir='tools/prof'; const f=fs.readdirSync(dir).filter(x=>x.endsWith('.cpuprofile'))[0];
const p=JSON.parse(fs.readFileSync(dir+'/'+f,'utf8'));
const by=new Map();
for (const n of p.nodes||[]) {
  const cf=n.callFrame||{}; const key=`${cf.functionName||'(anon)'} @ ${(cf.url||'').split('/').slice(-1)[0]}:${cf.lineNumber}`;
  by.set(key,(by.get(key)||0)+(n.hitCount||0));
}
const total=[...by.values()].reduce((a,b)=>a+b,0)||1;
[...by.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).forEach(([k,v])=>console.log((v/total*100).toFixed(1)+'%',v,k));
