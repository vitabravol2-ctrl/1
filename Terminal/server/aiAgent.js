const OpenAI = require('openai');
const { getStrategies } = require('./strategyLibrary');
const { readJson } = require('./store');
const hasKey = Boolean(process.env.OPENAI_API_KEY);
const client = hasKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function getMode() { return hasKey ? 'GPT' : 'SIM'; }

function analyzeMarket(pair, snap) {
  if (!snap) return `${pair}: market snapshot unavailable.`;
  return `${pair} analysis (${snap.source || 'DEMO'}): price ${snap.price}, bid ${snap.bid}, ask ${snap.ask}, spread ${snap.spreadPct}%, volatility ${snap.volatility}, trend ${snap.trend}, volume24h ${snap.volume24h || snap.volume}.`;
}
function suggestStrategies(pair) { return getStrategies().slice(0, 5).map((s) => ({ ...s, pair })); }
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

function buildDataPack(runtime, snap) {
  return {
    pair: runtime.selectedPair,
    price: snap?.price,
    bid: snap?.bid,
    ask: snap?.ask,
    spreadPct: snap?.spreadPct,
    volume24h: snap?.volume24h || snap?.volume,
    priceChange24hPct: snap?.priceChange24hPct || 0,
    klines: snap?.klines || {},
    trend: snap?.trend,
    volatility: snap?.volatility,
    runtime,
    currentStrategy: runtime.activeStrategy || null,
    riskConfig: readJson('config')
  };
}

async function askAgent(message, runtime, snap) {
  if (!client) {
    return {
      intent: 'EXPLAIN',
      answer: `AI SIM: ${message}`,
      suggestedStrategies: [],
      strategyPatch: {},
      riskNotes: ['SIM mode only'],
      requiresConfirmation: true
    };
  }
  const datapack = buildDataPack(runtime, snap);
  const completion = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are a trading assistant. You can not place orders. Return strict JSON with keys: intent,answer,suggestedStrategies,strategyPatch,riskNotes,requiresConfirmation.' },
      { role: 'user', content: JSON.stringify({ message, datapack }) }
    ]
  });
  return JSON.parse(completion.choices[0].message.content);
}

module.exports = { analyzeMarket, suggestStrategies, parseUserIntent, askAgent, getMode, buildDataPack };
