function check({ connected, mode, config, state, market, todayPnl }) {
  if (!connected) return { ok: false, reason: 'Trading blocked: not connected.' };
  if (mode === 'LIVE' || mode === 'LIVE_LOCKED') return { ok: false, reason: 'LIVE mode is blocked in v1.0.0.' };
  if (state.emergencyStop) return { ok: false, reason: 'Emergency stop active.' };
  if (todayPnl <= -Math.abs(config.scalping.maxDailyLoss)) return { ok: false, reason: 'Max daily loss reached.' };
  if (config.scalping.orderSizeUsdt <= 0) return { ok: false, reason: 'Invalid order size.' };
  if (!market.price) return { ok: false, reason: 'No market price.' };
  return { ok: true };
}

module.exports = { check };
