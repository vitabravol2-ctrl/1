const MAINNET_BASE = 'https://api.binance.com';
const TESTNET_BASE = 'https://testnet.binance.vision';

function loadKeysFromEnv() {
  return {
    apiKey: process.env.BINANCE_API_KEY || '',
    apiSecret: process.env.BINANCE_API_SECRET || '',
    testnetApiKey: process.env.BINANCE_TESTNET_API_KEY || '',
    testnetApiSecret: process.env.BINANCE_TESTNET_API_SECRET || '',
    useTestnet: String(process.env.BINANCE_USE_TESTNET || 'true').toLowerCase() === 'true'
  };
}

async function testConnection() {
  try {
    const r = await fetch(`${MAINNET_BASE}/api/v3/ping`);
    const data = await r.json();
    return { ok: r.ok, target: 'PUBLIC', data };
  } catch (e) {
    return { ok: false, target: 'PUBLIC', error: e.message };
  }
}

async function getAccountInfoReadOnly() {
  const keys = loadKeysFromEnv();
  if (!keys.testnetApiKey) return { ok: false, error: 'Missing testnet API key' };
  return { ok: true, locked: true, note: 'Private read-only stub. Live private endpoints blocked in v0.3.0.' };
}

async function getBalancesReadOnly() {
  const acc = await getAccountInfoReadOnly();
  if (!acc.ok) return acc;
  return { ok: true, balances: [] };
}

async function getSymbolInfo(pair) {
  const r = await fetch(`${MAINNET_BASE}/api/v3/exchangeInfo?symbol=${pair}`);
  const data = await r.json();
  return data.symbols?.[0] || null;
}

function normalizeOrderQty(_pair, qty) {
  return Number(Number(qty).toFixed(6));
}

async function validateOrderByFilters(pair, qty, _price) {
  const symbol = await getSymbolInfo(pair);
  if (!symbol) return { ok: false, reason: 'Symbol not found' };
  const lot = symbol.filters.find((f) => f.filterType === 'LOT_SIZE');
  if (lot && Number(qty) < Number(lot.minQty)) return { ok: false, reason: `qty below minQty ${lot.minQty}` };
  return { ok: true, reason: 'filters_ok', symbol };
}

async function placeTestnetOrderDrySafe(order) {
  const keys = loadKeysFromEnv();
  if (!keys.useTestnet) return { ok: false, error: 'BINANCE_USE_TESTNET=false, blocked' };
  return { ok: true, mode: 'TESTNET', drySafe: true, order, status: 'SIMULATED_TESTNET_ORDER' };
}

async function cancelTestnetOrder(orderId) {
  return { ok: true, orderId, status: 'SIMULATED_CANCELED' };
}

module.exports = {
  loadKeysFromEnv,
  testConnection,
  getAccountInfoReadOnly,
  getBalancesReadOnly,
  getSymbolInfo,
  normalizeOrderQty,
  validateOrderByFilters,
  placeTestnetOrderDrySafe,
  cancelTestnetOrder
};
