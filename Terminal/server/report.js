function createReport({ config, runtime, market, trades, logs, lastSuggested = [] }) {
  return `LOCAL AI TRADING TERMINAL REPORT
Version: v${config.version}
Settings: ${JSON.stringify(config, null, 2)}
Binance status: ${config.binanceApiStatus}
Runtime status: ${runtime.status}
Risk config: maxRisk=${config.maxRiskUsdt}, maxDailyLoss=${config.maxDailyLossUsdt}, maxOpenTrades=${config.maxOpenTrades}
Last market snapshot: ${JSON.stringify(market[runtime.selectedPair] || {}, null, 2)}
Last suggested strategies: ${lastSuggested.map((s) => s.name).join(', ') || 'None'}
Last trades: ${JSON.stringify(trades.slice(-5), null, 2)}
Last errors: ${JSON.stringify(logs.slice(-5), null, 2)}
Last AI answer: ${runtime.lastAiAnswer || 'n/a'}
Suggested next Codex task: Add real testnet signed order flow with strict read-only key checks.`;
}
module.exports = { createReport };
