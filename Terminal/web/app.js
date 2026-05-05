async function get(u){return fetch(u).then(r=>r.json())}
async function post(u,b={}){const r=await fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const j=await r.json();if(!j.ok&&j.error)alert(j.error);refresh();return j}

async function connectApi(){const useTestnet=document.getElementById('useTestnet').checked; if(!useTestnet){alert('LIVE mode warning: blocked in v1.0.0');}
const r=await post('/api/connect',{apiKey:apiKey.value,apiSecret:apiSecret.value,useTestnet});document.getElementById('env').textContent=useTestnet?'TESTNET':'LIVE'; if(r.ok)refresh();}

async function saveSettings(){const mode=modeEl.value; if(mode==='LIVE_LOCKED') alert('LIVE is blocked and requires future unlock + double confirmation.');
await post('/api/save-settings',{mode,scalping:{orderSizeUsdt:+orderSizeUsdt.value,takeProfitPct:+takeProfitPct.value,stopLossPct:+stopLossPct.value,buyBelowPct:+buyBelowPct.value,sellAbovePct:+sellAbovePct.value,cooldownSeconds:+cooldownSeconds.value,maxOpenPosition:+maxOpenPosition.value,maxDailyLoss:+maxDailyLoss.value}})}

const modeEl=document.getElementById('mode');
setInterval(async()=>{
 const m=await get('/api/market'); price.textContent=m.price; bid.textContent=m.bid; ask.textContent=m.ask; spread.textContent=m.spread; socket.textContent=m.socketStatus;
 const s=await get('/api/state'); conn.textContent=s.connectionStatus; balance.textContent=s.accountBalance; runtime.textContent=JSON.stringify(s,null,2);
 const t=await get('/api/trades'); trades.textContent=JSON.stringify(t.slice(-20),null,2);
 const l=await get('/api/logs'); errors.textContent=JSON.stringify(l,null,2);
},1200);

async function refresh(){const c=await get('/api/settings'); modeEl.value=c.mode;}
refresh();
