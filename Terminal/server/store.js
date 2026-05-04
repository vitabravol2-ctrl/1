const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

const defaults = {
  config: {
    version: '0.3.0',
    mode: 'DRY_RUN',
    selectedPair: 'BTCUSDT',
    riskUsdt: 20,
    maxRiskUsdt: 50,
    maxDailyLossUsdt: 100,
    tpPct: 1,
    slPct: 1,
    nonstop: false,
    maxOpenTrades: 1,
    tradeCooldownSec: 20,
    aiMode: 'SIM',
    marketSourcePriority: ['BINANCE', 'ALT_PUBLIC', 'DEMO'],
    binanceApiStatus: 'UNKNOWN',
    testnetEnabled: true,
    liveTradingEnabled: false,
    emergencyStop: false
  },
  runtime: {
    selectedPair: 'BTCUSDT',
    pendingPlan: null,
    activeStrategy: null,
    status: 'IDLE',
    position: null,
    cyclesCompleted: 0,
    lastAction: 'init',
    pnlUsdt: 0,
    pnlPct: 0
  },
  logs: [],
  trades: [],
  memory: [],
  strategies: [],
  market: {}
};

function filePath(name) { return path.join(dataDir, `${name}.json`); }
function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  Object.entries(defaults).forEach(([name, value]) => {
    const fp = filePath(name);
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, JSON.stringify(value, null, 2));
  });
}
function readJson(name) { return JSON.parse(fs.readFileSync(filePath(name), 'utf-8')); }
function writeJson(name, value) { fs.writeFileSync(filePath(name), JSON.stringify(value, null, 2)); return value; }

module.exports = { ensureDataFiles, readJson, writeJson, defaults };
