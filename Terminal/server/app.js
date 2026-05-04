require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { ensureDataFiles, readJson, writeJson } = require('./store');
const { getAllMarket, getMarketByPair } = require('./market');
const ai = require('./aiAgent');
const { getStrategies } = require('./strategyLibrary');
const { createPlan } = require('./strategyPlanner');
const { checkRisk } = require('./riskGuard');
const { remember } = require('./memory');
const { logError } = require('./logger');
const { startEngine, stopEngine } = require('./dryRunEngine');
const { createReport } = require('./report');

ensureDataFiles();
writeJson('strategies', getStrategies());
startEngine((pair) => getMarketByPair(pair));

const app = express();
app.use(cors());
app.use(express.json());
app.use('/web', express.static(path.join(__dirname, '..', 'web')));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '..', 'web', 'index.html')));

let lastSuggested = [];

app.get('/api/status', (_q, res) => res.json({ server: 'OK', mode: 'DRY_RUN', liveTradingBlocked: true, marketSource: readJson('runtime').marketSource || 'DEMO', aiMode: ai.getMode() }));
app.get('/api/config', (_q, res) => res.json(readJson('config')));
app.get('/api/market', async (_q, res) => { const market = await getAllMarket(); const r=readJson('runtime'); r.marketSource = Object.values(market)[0]?.source?.includes('BINANCE') ? 'BINANCE' : 'DEMO'; writeJson('runtime', r); res.json(market); });
app.get('/api/market/:pair', async (q, res) => {
  const data = await getMarketByPair(q.params.pair.toUpperCase());
  if (!data) return res.status(404).json({ error: 'Pair not found' });
  return res.json(data);
});
app.get('/api/strategies', (_q, res) => res.json(getStrategies()));
app.get('/api/runtime', (_q, res) => res.json(readJson('runtime')));
app.get('/api/trades', (_q, res) => res.json(readJson('trades')));
app.get('/api/logs', (_q, res) => res.json(readJson('logs')));

app.post('/api/select-pair', (req, res) => {
  const runtime = readJson('runtime');
  runtime.selectedPair = String(req.body.pair || '').toUpperCase();
  writeJson('runtime', runtime);
  res.json({ ok: true, selectedPair: runtime.selectedPair });
});

app.post('/api/create-plan', (req, res) => {
  try {
    const runtime = readJson('runtime');
    const config = readJson('config');
    const plan = createPlan({ pair: runtime.selectedPair, strategyId: req.body.strategyId, overrides: req.body.overrides || {}, config, riskGuard: checkRisk });
    runtime.pendingPlan = plan;
    writeJson('runtime', runtime);
    res.json({ ok: true, plan });
  } catch (e) {
    logError('PLAN_ERROR', e.message, {});
    res.status(400).json({ ok: false, error: e.message });
  }
});
app.post('/api/confirm-plan', (_req, res) => {
  const runtime = readJson('runtime');
  if (!runtime.pendingPlan) return res.status(400).json({ ok: false, error: 'No pending plan' });
  if (!runtime.pendingPlan.riskCheck.ok) return res.status(400).json({ ok: false, error: runtime.pendingPlan.riskCheck.reason });
  runtime.activeStrategy = { ...runtime.pendingPlan, status: 'RUNNING', startedAt: new Date().toISOString() };
  runtime.pendingPlan = null;
  runtime.status = 'RUNNING';
  writeJson('runtime', runtime);
  remember('strategy_started', runtime.selectedPair, 'confirm plan', 'running');
  res.json({ ok: true, runtime });
});
app.post('/api/cancel-plan', (_req, res) => { const r = readJson('runtime'); r.pendingPlan = null; writeJson('runtime', r); res.json({ ok: true }); });
app.post('/api/stop-strategy', (_req, res) => { const r = readJson('runtime'); r.activeStrategy = null; r.status = 'IDLE'; writeJson('runtime', r); remember('strategy_stopped', r.selectedPair, 'stop strategy', 'idle'); res.json({ ok: true, runtime: r }); });
app.post('/api/emergency-stop', (_req, res) => { const c = readJson('config'); const r = readJson('runtime'); c.emergencyStop = true; r.activeStrategy = null; r.status = 'STOPPED'; writeJson('config', c); writeJson('runtime', r); stopEngine(); logError('EMERGENCY_STOP', 'Emergency stop activated'); res.json({ ok: true }); });

app.post('/api/chat', async (req, res) => {
  const message = String(req.body.message || '');
  const runtime = readJson('runtime');
  const snapshot = await getMarketByPair(runtime.selectedPair);
  const intent = ai.parseUserIntent(message, runtime.selectedPair);
  if (intent.action === 'SUGGEST') {
    lastSuggested = ai.suggestStrategies(runtime.selectedPair, snapshot);
    remember('strategy_suggested', runtime.selectedPair, message, `suggested ${lastSuggested.length}`);
    return res.json({ ok: true, type: 'suggestions', suggestions: lastSuggested });
  }
  if (intent.action === 'ANALYZE') return res.json({ ok: true, type: 'analysis', text: ai.analyzeMarket(runtime.selectedPair, snapshot) });
  if (intent.action === 'PLAN_SCALPING') {
    const overrides = {};
    if (intent.tpPct !== undefined) overrides.tpPct = intent.tpPct;
    if (intent.riskUsdt !== undefined) overrides.riskUsdt = intent.riskUsdt;
    const config = readJson('config');
    const plan = createPlan({ pair: runtime.selectedPair, strategyId: 'both-side-scalping', overrides, config, riskGuard: checkRisk });
    runtime.pendingPlan = plan;
    writeJson('runtime', runtime);
    return res.json({ ok: true, type: 'plan', plan });
  }
  if (intent.action === 'STOP') {
    runtime.activeStrategy = null; runtime.status = 'IDLE'; writeJson('runtime', runtime);
    return res.json({ ok: true, type: 'status', text: 'Strategy stopped. Runtime is IDLE.' });
  }
  if (intent.action === 'STATUS') return res.json({ ok: true, type: 'status', text: `Runtime: ${runtime.status}, pair: ${runtime.selectedPair}, pnl: ${runtime.pnlUsdt} USDT` });
  const gpt = await ai.askAgent(message, runtime, snapshot);
  res.json({ ok: true, type: 'agent', agent: gpt, text: gpt.answer });
});

app.post('/api/report', (_req, res) => {
  const config = readJson('config');
  const runtime = readJson('runtime');
  const market = readJson('market');
  const trades = readJson('trades');
  const logs = readJson('logs');
  res.json({ ok: true, report: createReport({ config, runtime, market, trades, logs, lastSuggested }) });
});

app.listen(3000, () => console.log('Local AI Trading Terminal on http://localhost:3000'));

app.get('/api/test-binance', async (_req, res) => { const m = await getMarketByPair('BTCUSDT'); res.json({ ok: true, source: m?.sourceStatus || 'FALLBACK_DEMO', price: m?.price }); });

app.post('/api/test-gpt', async (req, res) => { const runtime = readJson('runtime'); const snap = await getMarketByPair(runtime.selectedPair); const r = await ai.askAgent(req.body.message || 'какие стратегии предложишь?', runtime, snap); res.json({ ok: true, aiMode: ai.getMode(), response: r }); });
