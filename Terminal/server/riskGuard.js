const allowedPairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];

function checkRisk(plan, config, runtime = {}) {
  if (config.mode === 'LIVE_LOCKED' || config.liveTradingEnabled) return { ok: false, reason: 'LIVE trading is LOCKED in v0.3.0' };
  if (config.emergencyStop) return { ok: false, reason: 'Emergency stop is active' };
  if (!runtime.pendingPlan && !plan?.confirmed) return { ok: false, reason: 'Trading without confirmed plan is forbidden' };
  if (!allowedPairs.includes(plan.pair)) return { ok: false, reason: 'Unknown trading pair' };
  const s = plan.settings || {};
  if ((s.riskUsdt || 0) > (config.maxRiskUsdt || 0)) return { ok: false, reason: `Risk exceeds max ${config.maxRiskUsdt} USDT` };
  if ((config.maxOpenTrades || 1) < 1) return { ok: false, reason: 'maxOpenTrades must be >= 1' };
  if ((config.tpPct || 0) <= 0 || (config.slPct || 0) <= 0) return { ok: false, reason: 'TP/SL must be > 0' };
  if (!['DRY_RUN', 'TESTNET', 'LIVE_LOCKED'].includes(config.mode)) return { ok: false, reason: 'Invalid mode' };
  return { ok: true, reason: 'Risk Guard: OK' };
}

module.exports = { checkRisk, allowedPairs };
