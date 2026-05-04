const allowedPairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];

function checkRisk(plan, config) {
  if (config.liveTradingEnabled) return { ok: false, reason: 'LIVE trading must remain disabled in v0.1' };
  if (config.emergencyStop) return { ok: false, reason: 'Emergency stop is active' };
  if (!allowedPairs.includes(plan.pair)) return { ok: false, reason: 'Unknown trading pair' };
  const { tpPct = 0, slPct = 0, riskUsdt = 0 } = plan.settings || {};
  if (riskUsdt > config.maxRiskUsdt) return { ok: false, reason: `Risk exceeds max ${config.maxRiskUsdt} USDT` };
  if (tpPct < 0 || tpPct > config.maxTpPct) return { ok: false, reason: `TP% out of bounds (0-${config.maxTpPct})` };
  if (slPct < 0 || slPct > config.maxSlPct) return { ok: false, reason: `SL% out of bounds (0-${config.maxSlPct})` };
  return { ok: true, reason: 'Risk Guard: OK' };
}

module.exports = { checkRisk, allowedPairs };
