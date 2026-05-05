const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

const files = {
  config: 'config.json',
  state: 'state.json',
  trades: 'trades.json',
  logs: 'logs.json',
  secrets: 'secrets.local.json'
};

const defaults = {
  config: {
    pair: 'BTCUSDT',
    useTestnet: true,
    mode: 'DRY_RUN',
    scalping: {
      orderSizeUsdt: 20,
      takeProfitPct: 0.2,
      stopLossPct: 0.2,
      buyBelowPct: 0.1,
      sellAbovePct: 0.1,
      cooldownSeconds: 15,
      maxOpenPosition: 1,
      maxDailyLoss: 20
    }
  },
  state: {
    connectionStatus: 'DISCONNECTED',
    botStatus: 'STOPPED',
    accountBalance: 0,
    position: null,
    unrealizedPnl: 0,
    realizedPnl: 0,
    cyclesCount: 0,
    lastAction: 'IDLE',
    emergencyStop: false,
    errors: []
  },
  trades: [],
  logs: []
};

function ensure() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  Object.entries(files).forEach(([key, file]) => {
    const full = path.join(dataDir, file);
    if (!fs.existsSync(full) && defaults[key] !== undefined) {
      fs.writeFileSync(full, JSON.stringify(defaults[key], null, 2));
    }
  });
}

function read(name) {
  ensure();
  const file = path.join(dataDir, files[name]);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    const fallback = defaults[name] ?? {};
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

function write(name, data) {
  ensure();
  const file = path.join(dataDir, files[name]);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = { ensure, read, write };
