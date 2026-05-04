const { getStrategies } = require('./strategyLibrary');

function analyzeMarket(pair, snap) {
  if (!snap) return `${pair}: market snapshot unavailable.`;
  return `${pair} analysis (DEMO): price ${snap.price}, spread ${snap.spreadPct}%, volatility ${snap.volatility}, trend ${snap.trend}, volume ${snap.volume}.`;
}
function suggestStrategies(pair) {
  return getStrategies().slice(0, 5).map((s) => ({ ...s, pair }));
}
function parseUserIntent(message, selectedPair) {
  const m = message.toLowerCase();
  const riskMatch = m.match(/риск\s*(\d+)|risk\s*(\d+)/i);
  const tpMatch = m.match(/(профит|tp|profit)\s*(\d+(?:[\.,]\d+)?)/i);
  return {
    action: m.includes('останов') || m.includes('stop strategy') ? 'STOP' : m.includes('стратег') && m.includes('предлож') ? 'SUGGEST' : m.includes('анализ') ? 'ANALYZE' : m.includes('скальп') ? 'PLAN_SCALPING' : m.includes('статус') ? 'STATUS' : 'CHAT',
    pair: selectedPair,
    riskUsdt: riskMatch ? Number((riskMatch[1] || riskMatch[2])) : undefined,
    tpPct: tpMatch ? Number((tpMatch[2] || '0').replace(',', '.')) : undefined
  };
}
function explainStrategy(strategy) { return `${strategy.name}: ${strategy.description}`; }
function buildAnswer(message) { return `AI simulator processed: ${message}`; }

module.exports = { analyzeMarket, suggestStrategies, parseUserIntent, explainStrategy, buildAnswer };
