const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

const defaults = {
  config: {
    version: '0.1.0',
    mode: 'DRY_RUN',
    liveTradingEnabled: false,
    aiEnabled: false,
    binanceEnabled: false,
    maxRiskUsdt: 50,
    maxTpPct: 5,
    maxSlPct: 10,
    emergencyStop: false
  },
  runtime: {
    selectedPair: 'BTCUSDT',
    pendingPlan: null,
    activeStrategy: null,
    status: 'IDLE',
    pnlUsdt: 0,
    pnlPct: 0
  },
  logs: [],
  trades: [],
  memory: [],
  strategies: [],
  market: {}
};

function filePath(name) {
  return path.join(dataDir, `${name}.json`);
}

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  Object.entries(defaults).forEach(([name, value]) => {
    const fp = filePath(name);
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, JSON.stringify(value, null, 2));
  });
}

function readJson(name) {
  return JSON.parse(fs.readFileSync(filePath(name), 'utf-8'));
}

function writeJson(name, value) {
  fs.writeFileSync(filePath(name), JSON.stringify(value, null, 2));
  return value;
}

module.exports = { ensureDataFiles, readJson, writeJson, defaults };
