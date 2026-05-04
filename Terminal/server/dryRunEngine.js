const { readJson, writeJson } = require('./store');
const { remember } = require('./memory');

let timer = null;

function tick(getPrice) {
  const runtime = readJson('runtime');
  const config = readJson('config');
  if (!runtime.activeStrategy || runtime.status !== 'RUNNING') return;
  const trades = readJson('trades');
  const price = getPrice(runtime.selectedPair)?.price || 100;
  const riskUsdt = runtime.activeStrategy.settings.riskUsdt || config.riskUsdt;
  const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
  const movePct = Number((Math.random() * 2 * config.tpPct - config.slPct).toFixed(2));
  const pnlUsdt = Number(((movePct / 100) * riskUsdt).toFixed(2));
  const trade = { id: `trade_${Date.now()}`, time: new Date().toISOString(), pair: runtime.selectedPair, strategy: runtime.activeStrategy.strategyName, side, entryPrice: price, exitPrice: Number((price * (1 + movePct / 100)).toFixed(4)), qty: Number((riskUsdt / price).toFixed(6)), riskUsdt, pnlUsdt, pnlPct: movePct, status: 'CLOSED', mode: 'DRY_RUN' };
  trades.push(trade); writeJson('trades', trades.slice(-300));
  remember('trade_opened', runtime.selectedPair, `${side} ${price}`, 'opened');
  remember('trade_closed', runtime.selectedPair, `pnl ${pnlUsdt}`, 'closed');
  runtime.position = null;
  runtime.cyclesCompleted = (runtime.cyclesCompleted || 0) + 1;
  runtime.lastAction = `cycle ${runtime.cyclesCompleted}`;
  const all = readJson('trades'); runtime.pnlUsdt = Number(all.reduce((s, t) => s + t.pnlUsdt, 0).toFixed(2)); runtime.pnlPct = Number(((runtime.pnlUsdt / Math.max(all.reduce((s, t) => s + (t.riskUsdt || 0), 1), 1)) * 100).toFixed(2));
  if (!config.nonstop) { runtime.status = 'STOPPED'; runtime.activeStrategy = null; }
  writeJson('runtime', runtime);
}

function startEngine(getPrice) { if (timer) clearInterval(timer); timer = setInterval(() => tick(getPrice), 3000); }
function stopEngine() { if (timer) clearInterval(timer); timer = null; }
module.exports = { startEngine, stopEngine };
