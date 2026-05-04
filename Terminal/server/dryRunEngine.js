const { readJson, writeJson } = require('./store');

let timer = null;

function randomSide() { return Math.random() > 0.5 ? 'LONG' : 'SHORT'; }
function randomPnl(risk) { return Number(((Math.random() * 2 - 1) * (risk * 0.2)).toFixed(2)); }

function tick(getPrice) {
  const runtime = readJson('runtime');
  if (!runtime.activeStrategy || runtime.status !== 'RUNNING') return;
  const trades = readJson('trades');
  if (Math.random() < 0.65) {
    const price = getPrice(runtime.selectedPair)?.price || 100;
    const riskUsdt = runtime.activeStrategy.settings.riskUsdt || 20;
    const pnlUsdt = randomPnl(riskUsdt);
    const entryPrice = Number((price * (1 + (Math.random() * 0.003 - 0.0015))).toFixed(3));
    const exitPrice = Number((entryPrice * (1 + pnlUsdt / Math.max(riskUsdt * 20, 1))).toFixed(3));
    trades.push({
      id: `trade_${Date.now()}`,
      time: new Date().toISOString(),
      pair: runtime.selectedPair,
      strategy: runtime.activeStrategy.strategyName,
      side: randomSide(),
      entryPrice,
      exitPrice,
      qty: Number((riskUsdt / Math.max(entryPrice, 1)).toFixed(6)),
      riskUsdt,
      pnlUsdt,
      pnlPct: Number(((pnlUsdt / Math.max(riskUsdt, 1)) * 100).toFixed(2)),
      status: 'CLOSED',
      mode: 'DRY_RUN'
    });
    writeJson('trades', trades.slice(-300));
  }
  const all = readJson('trades');
  const pnlUsdt = Number(all.reduce((sum, t) => sum + t.pnlUsdt, 0).toFixed(2));
  const totalRisk = all.reduce((sum, t) => sum + (t.riskUsdt || 0), 0) || 1;
  runtime.pnlUsdt = pnlUsdt;
  runtime.pnlPct = Number(((pnlUsdt / totalRisk) * 100).toFixed(2));
  writeJson('runtime', runtime);
}

function startEngine(getPrice) {
  if (timer) clearInterval(timer);
  timer = setInterval(() => tick(getPrice), 2500);
}

function stopEngine() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { startEngine, stopEngine };
