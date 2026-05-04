const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const brokenDir = path.join(dataDir, 'broken');

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

function ensureBrokenDir() {
  if (!fs.existsSync(brokenDir)) fs.mkdirSync(brokenDir, { recursive: true });
}

function backupBrokenJson(name, raw) {
  ensureBrokenDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(brokenDir, `${name}.${timestamp}.json`);
  fs.writeFileSync(backupPath, raw);
}

function defaultValue(name) {
  const value = defaults[name];
  return value === undefined ? null : JSON.parse(JSON.stringify(value));
}

function sanitizeMergeConflictJson(raw) {
  if (typeof raw !== 'string' || raw.length === 0) return raw;
  const lines = raw.split(/\r?\n/);
  if (!lines.some((line) => line.startsWith('<<<<<<< ') || line.startsWith('=======') || line.startsWith('>>>>>>> '))) {
    return raw;
  }

  const cleaned = [];
  let inConflict = false;
  let useIncoming = false;
  for (const line of lines) {
    if (line.startsWith('<<<<<<< ')) {
      inConflict = true;
      useIncoming = false;
      continue;
    }
    if (inConflict && line.startsWith('=======')) {
      useIncoming = true;
      continue;
    }
    if (inConflict && line.startsWith('>>>>>>> ')) {
      inConflict = false;
      useIncoming = false;
      continue;
    }
    if (!inConflict || useIncoming) cleaned.push(line);
  }

  return cleaned.join('\n');
}

function safeReadJson(name) {
  const fp = filePath(name);
  const raw = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf-8') : '';
  const candidate = sanitizeMergeConflictJson(raw);
  try {
    return JSON.parse(candidate);
  } catch {
    const fallback = defaultValue(name);
    try {
      backupBrokenJson(name, raw);
    } catch {
      // no-op: keep server alive even if backup fails
    }
    writeJson(name, fallback);
    return fallback;
  }
}

function readJson(name) {
  return safeReadJson(name);
}

function writeJson(name, value) {
  fs.writeFileSync(filePath(name), JSON.stringify(value, null, 2));
  return value;
}

module.exports = { ensureDataFiles, readJson, safeReadJson, writeJson, defaults };
