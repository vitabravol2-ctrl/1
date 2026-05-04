const el = (id) => document.getElementById(id);
let lastSuggestions = [];
function addMsg(text, cls='ai'){ const d=document.createElement('div'); d.className=`msg ${cls}`; d.textContent=text; el('chatLog').appendChild(d); el('chatLog').scrollTop=el('chatLog').scrollHeight; }
async function j(url,opt){ const r=await fetch(url,{headers:{'Content-Type':'application/json'},...opt}); return r.json(); }
async function refresh(){
  const [status, runtime, market, trades, logs] = await Promise.all([j('/api/status'),j('/api/runtime'),j('/api/market'),j('/api/trades'),j('/api/logs')]);
  el('topStatus').textContent=`${status.mode} | AI ${status.aiMode} | Market Source: ${status.marketSource} | Server ${status.server}`;
  el('runtime').textContent=JSON.stringify(runtime,null,2);
  const m = market[runtime.selectedPair]||{};
  el('market').innerHTML=`<h3>${runtime.selectedPair} (${m.sourceStatus || 'FALLBACK_DEMO'})</h3><p>Price: ${m.price}</p><p>Bid: ${m.bid}</p><p>Ask: ${m.ask}</p><p>Spread: ${m.spreadPct}%</p><p>24h Change: ${m.priceChange24hPct || 0}%</p><p>Volume: ${m.volume24h || m.volume}</p><p>Volatility: ${m.volatility}</p><p>Trend: ${m.trend}</p>`;
  const s = runtime.activeStrategy || runtime.pendingPlan;
  el('strategy').innerHTML=s?`<h3>${s.strategyName}</h3><p>Direction: ${s.settings.direction}</p><p>TP: ${s.settings.tpPct}%</p><p>SL: ${s.settings.slPct}%</p><p>Risk: ${s.settings.riskUsdt} USDT</p><p>Non-stop: ${s.settings.nonstop?'ON':'OFF'}</p><p>Status: ${s.status || runtime.status}</p>`:'<p>No strategy selected.</p>';
  el('pendingPlan').innerHTML = runtime.pendingPlan ? `<h3>Strategy Plan (DRY-RUN)</h3><pre>${JSON.stringify(runtime.pendingPlan,null,2)}</pre><button id='confirmPlan'>Confirm</button><button id='cancelPlan'>Cancel</button>` : '<p>No pending plan.</p>';
  el('trades').innerHTML = trades.slice(-8).reverse().map(t=>`<div>${t.time} | ${t.strategy} | ${t.side} | PnL ${t.pnlUsdt} USDT (${t.mode})</div>`).join('');
  el('errors').innerHTML = logs.slice(-8).reverse().map(l=>`<div style='color:#f87171'>${l.time} ${l.type}: ${l.message}</div>`).join('') || '<div>No errors</div>';
  const c = el('confirmPlan'); if(c) c.onclick=async()=>{ await j('/api/confirm-plan',{method:'POST'}); refresh(); };
  const cc = el('cancelPlan'); if(cc) cc.onclick=async()=>{ await j('/api/cancel-plan',{method:'POST'}); refresh(); };
}
el('chatForm').onsubmit=async(e)=>{e.preventDefault(); const msg=el('chatInput').value.trim(); if(!msg) return; addMsg(msg,'user'); el('chatInput').value=''; const r=await j('/api/chat',{method:'POST',body:JSON.stringify({message:msg})}); if(r.text) addMsg(r.text); if(r.suggestions){ lastSuggestions=r.suggestions; addMsg('Suggested: '+r.suggestions.map(s=>s.name).join(', ')); } if(r.plan) addMsg('Plan created. Review and confirm.'); refresh();};
document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{el('chatInput').value=b.dataset.q; el('chatForm').requestSubmit();});
el('pair').onchange=async(e)=>{await j('/api/select-pair',{method:'POST',body:JSON.stringify({pair:e.target.value})});refresh();};
el('startSelected').onclick=async()=>{ const s=(lastSuggestions[0]||{}).id||'both-side-scalping'; await j('/api/create-plan',{method:'POST',body:JSON.stringify({strategyId:s})}); refresh(); };
el('stopBtn').onclick=async()=>{ await j('/api/stop-strategy',{method:'POST'}); refresh(); };
el('emergencyBtn').onclick=async()=>{ await j('/api/emergency-stop',{method:'POST'}); refresh(); };
el('testBinanceBtn').onclick=async()=>{ const r=await j('/api/test-binance'); addMsg(`Binance test: ${r.source}, BTCUSDT ${r.price}`); };
el('testGptBtn').onclick=async()=>{ const r=await j('/api/test-gpt',{method:'POST',body:JSON.stringify({message:'какие стратегии предложишь?'})}); addMsg(`GPT test (${r.aiMode}): ${r.response.answer}`); };
el('reportBtn').onclick=async()=>{ const r=await j('/api/report',{method:'POST'}); el('reportText').value=r.report; el('reportModal').classList.remove('hidden'); };
el('closeReport').onclick=()=>el('reportModal').classList.add('hidden');
setInterval(refresh,3000); refresh();
