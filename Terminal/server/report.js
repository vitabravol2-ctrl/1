function createReport({ config, runtime, market, trades, logs, lastSuggested = [] }) {
  return `LOCAL AI TRADING TERMINAL REPORT
Version: v${config.version}
Mode: ${config.mode}
AI: OFF / SIMULATED
Binance: OFF
Selected pair: ${runtime.selectedPair}
Active strategy: ${runtime.activeStrategy ? runtime.activeStrategy.strategyName : 'None'}
Runtime status: ${runtime.status}
Last market snapshot: ${JSON.stringify(market[runtime.selectedPair] || {}, null, 2)}
Last suggested strategies: ${lastSuggested.map((s) => s.name).join(', ') || 'None'}
Last trades: ${JSON.stringify(trades.slice(-5), null, 2)}
Last errors: ${JSON.stringify(logs.slice(-5), null, 2)}
Current config: ${JSON.stringify(config, null, 2)}
Problem:
Expected:
Actual:
Suggested next Codex task:`;
}

module.exports = { createReport };
