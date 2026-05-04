const { readJson, writeJson } = require('./store');
const { logError } = require('./logger');

const BINANCE_BASE = 'https://api.binance.com';
const INTERVALS = ['1m', '5m', '15m'];

const base = {
  BTCUSDT: { price: 64000, bid: 63990, ask: 64010, volatility: 'MEDIUM', trend: 'SIDEWAYS', volume: 120000 },
  ETHUSDT: { price: 3100, bid: 3099, ask: 3101, volatility: 'MEDIUM', trend: 'UP', volume: 98000 },
  BNBUSDT: { price: 590, bid: 589.8, ask: 590.2, volatility: 'LOW', trend: 'SIDEWAYS', volume: 55000 },
  SOLUSDT: { price: 145, bid: 144.9, ask: 145.1, volatility: 'HIGH', trend: 'DOWN', volume: 86000 }
};

function jitter(n, pct = 0.0025) { return n * (1 + (Math.random() * 2 - 1) * pct); }

function computeTrend(klines) {
  if (!klines?.length) return 'SIDEWAYS';
  const first = Number(klines[0][1]);
  const last = Number(klines[klines.length - 1][4]);
  const drift = ((last - first) / first) * 100;
  if (drift > 0.25) return 'UP';
  if (drift < -0.25) return 'DOWN';
  return 'SIDEWAYS';
}

function computeVolatility(klines) {
  if (!klines?.length) return 'MEDIUM';
  const closes = klines.map((k) => Number(k[4]));
  const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
  const std = Math.sqrt(closes.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) / closes.length);
  const cv = (std / mean) * 100;
  if (cv >= 1) return 'HIGH';
  if (cv <= 0.35) return 'LOW';
  return 'MEDIUM';
}

function mutate(pair, snap) {
  const price = Number(jitter(snap.price).toFixed(pair.includes('BTC') ? 2 : 3));
  const spreadAbs = Math.max(price * 0.00015, 0.01);
  const bid = Number((price - spreadAbs / 2).toFixed(3));
  const ask = Number((price + spreadAbs / 2).toFixed(3));
  const spreadPct = Number((((ask - bid) / price) * 100).toFixed(4));
  return { ...snap, price, bid, ask, spreadPct, source: 'DEMO', sourceStatus: 'FALLBACK_DEMO', updatedAt: new Date().toISOString() };
}

function refreshDemoMarket() {
  const state = {};
  Object.entries(base).forEach(([pair, snap]) => {
    state[pair] = mutate(pair, snap);
    base[pair].price = state[pair].price;
  });
  writeJson('market', state);
  return state;
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { 'content-type': 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function fetchBinancePair(pair) {
  const [price, bookTicker, ticker24h, kline1m, kline5m, kline15m] = await Promise.all([
    fetchJson(`${BINANCE_BASE}/api/v3/ticker/price?symbol=${pair}`),
    fetchJson(`${BINANCE_BASE}/api/v3/ticker/bookTicker?symbol=${pair}`),
    fetchJson(`${BINANCE_BASE}/api/v3/ticker/24hr?symbol=${pair}`),
    fetchJson(`${BINANCE_BASE}/api/v3/klines?symbol=${pair}&interval=1m&limit=50`),
    fetchJson(`${BINANCE_BASE}/api/v3/klines?symbol=${pair}&interval=5m&limit=50`),
    fetchJson(`${BINANCE_BASE}/api/v3/klines?symbol=${pair}&interval=15m&limit=50`)
  ]);
  const p = Number(price.price);
  const bid = Number(bookTicker.bidPrice);
  const ask = Number(bookTicker.askPrice);
  const spreadPct = Number((((ask - bid) / p) * 100).toFixed(4));
  const klines = { '1m': kline1m, '5m': kline5m, '15m': kline15m };
  return {
    price: p,
    bid,
    ask,
    spreadPct,
    volume: Number(ticker24h.volume),
    volume24h: Number(ticker24h.volume),
    priceChange24hPct: Number(ticker24h.priceChangePercent),
    trend: computeTrend(kline15m),
    volatility: computeVolatility(kline15m),
    klines,
    source: 'BINANCE_PUBLIC',
    sourceStatus: 'BINANCE_OK',
    updatedAt: new Date().toISOString()
  };
}

async function refreshMarket() {
  const pairs = Object.keys(base);
  try {
    const rows = await Promise.all(pairs.map(async (pair) => [pair, await fetchBinancePair(pair)]));
    const state = Object.fromEntries(rows);
    writeJson('market', state);
    return state;
  } catch (e) {
    logError('BINANCE_PUBLIC_ERROR', e.message, { source: 'BINANCE_PUBLIC' });
    return refreshDemoMarket();
  }
}

async function getAllMarket() { return refreshMarket(); }
async function getMarketByPair(pair) { const all = await getAllMarket(); return all[pair] || null; }

module.exports = { getAllMarket, getMarketByPair, INTERVALS };
