const { readJson, writeJson } = require('./store');

const base = {
  BTCUSDT: { price: 64000, bid: 63990, ask: 64010, volatility: 'MEDIUM', trend: 'SIDEWAYS', volume: 120000 },
  ETHUSDT: { price: 3100, bid: 3099, ask: 3101, volatility: 'MEDIUM', trend: 'UP', volume: 98000 },
  BNBUSDT: { price: 590, bid: 589.8, ask: 590.2, volatility: 'LOW', trend: 'SIDEWAYS', volume: 55000 },
  SOLUSDT: { price: 145, bid: 144.9, ask: 145.1, volatility: 'HIGH', trend: 'DOWN', volume: 86000 }
};

function jitter(n, pct = 0.0025) {
  return n * (1 + (Math.random() * 2 - 1) * pct);
}

function mutate(pair, snap) {
  const price = Number(jitter(snap.price).toFixed(pair.includes('BTC') ? 2 : 3));
  const spreadAbs = Math.max(price * 0.00015, 0.01);
  const bid = Number((price - spreadAbs / 2).toFixed(3));
  const ask = Number((price + spreadAbs / 2).toFixed(3));
  const spreadPct = Number((((ask - bid) / price) * 100).toFixed(4));
  return { ...snap, price, bid, ask, spreadPct, source: 'DEMO', updatedAt: new Date().toISOString() };
}

function refreshMarket() {
  const state = {};
  Object.entries(base).forEach(([pair, snap]) => {
    state[pair] = mutate(pair, snap);
    base[pair].price = state[pair].price;
  });
  writeJson('market', state);
  return state;
}

function getAllMarket() {
  const current = readJson('market');
  if (!Object.keys(current).length) return refreshMarket();
  return refreshMarket();
}

function getMarketByPair(pair) {
  const all = getAllMarket();
  return all[pair] || null;
}

module.exports = { getAllMarket, getMarketByPair };
