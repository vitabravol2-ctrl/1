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
const binance = require('./binanceClient');

ensureDataFiles(); writeJson('strategies', getStrategies()); startEngine((pair) => getMarketByPair(pair));
const app = express(); app.use(cors()); app.use(express.json());
app.use('/web', express.static(path.join(__dirname, '..', 'web'))); app.get('/', (_q, res) => res.sendFile(path.join(__dirname, '..', 'web', 'index.html')));
let lastSuggested = [];

app.get('/api/status', (_q, res) => { const c = readJson('config'); const r = readJson('runtime'); res.json({ server: 'OK', mode: c.mode, liveTradingBlocked: true, marketSource: readJson('runtime').marketSource || 'ALT_PUBLIC', aiMode: c.aiMode, runtimeStatus: r.status }); });
app.get('/api/config', (_q, res) => res.json(readJson('config')));
app.post('/api/config', (req, res) => { const c = { ...readJson('config'), ...req.body, liveTradingEnabled: false }; writeJson('config', c); remember('settings_changed', c.selectedPair, 'settings saved', c.mode); res.json({ ok: true, config: c }); });
app.get('/api/market', async (_q, res) => { const market = await getAllMarket(); const r = readJson('runtime'); r.marketSource = Object.values(market)[0]?.source || 'ALT_PUBLIC'; writeJson('runtime', r); res.json(market); });
app.get('/api/runtime', (_q, res) => res.json(readJson('runtime')));
app.get('/api/trades', (_q, res) => res.json(readJson('trades')));
app.get('/api/logs', (_q, res) => res.json(readJson('logs')));

app.post('/api/create-plan', (req, res) => { try { const runtime = readJson('runtime'); const config = readJson('config'); const plan = createPlan({ pair: runtime.selectedPair, strategyId: req.body.strategyId, overrides: req.body.overrides || {}, config, riskGuard: (p, c) => checkRisk(p, c, runtime) }); runtime.pendingPlan = plan; runtime.status = 'WAITING_CONFIRMATION'; writeJson('runtime', runtime); res.json({ ok: true, plan }); } catch (e) { logError('PLAN_ERROR', e.message, {}); res.status(400).json({ ok: false, error: e.message }); } });
app.post('/api/cancel-plan', (_q, res) => { const r = readJson('runtime'); r.pendingPlan = null; r.status = 'IDLE'; writeJson('runtime', r); res.json({ ok: true }); });
app.post('/api/confirm-plan', (_req, res) => { const runtime = readJson('runtime'); if (!runtime.pendingPlan) return res.status(400).json({ ok: false, error: 'No pending plan' }); runtime.pendingPlan.confirmed = true; const config = readJson('config'); const risk = checkRisk(runtime.pendingPlan, config, runtime); if (!risk.ok) return res.status(400).json({ ok: false, error: risk.reason }); runtime.activeStrategy = { ...runtime.pendingPlan, status: 'RUNNING', startedAt: new Date().toISOString() }; runtime.pendingPlan = null; runtime.status = 'RUNNING'; writeJson('runtime', runtime); remember('strategy_started', runtime.selectedPair, 'confirm plan', 'running'); res.json({ ok: true }); });
app.post('/api/pause', (_q, res) => { const r = readJson('runtime'); r.status = 'PAUSED'; r.lastAction = 'pause'; writeJson('runtime', r); res.json({ ok: true }); });
app.post('/api/resume', (_q, res) => { const r = readJson('runtime'); r.status = 'RUNNING'; r.lastAction = 'resume'; writeJson('runtime', r); res.json({ ok: true }); });
app.post('/api/stop-strategy', (_q, res) => { const r = readJson('runtime'); r.activeStrategy = null; r.status = 'STOPPED'; r.lastAction = 'stop'; writeJson('runtime', r); remember('strategy_stopped', r.selectedPair, 'stop strategy', 'stopped'); res.json({ ok: true }); });
app.post('/api/emergency-stop', (_q, res) => { const c = readJson('config'); const r = readJson('runtime'); c.emergencyStop = true; r.activeStrategy = null; r.status = 'EMERGENCY_STOP'; writeJson('config', c); writeJson('runtime', r); stopEngine(); logError('EMERGENCY_STOP', 'Emergency stop activated'); res.json({ ok: true }); });

app.get('/api/binance/public-test', async (_q, res) => res.json(await binance.testConnection()));
app.get('/api/binance/private-test', async (_q, res) => res.json(await binance.getAccountInfoReadOnly()));
app.get('/api/binance/testnet-test', async (_q, res) => res.json(await binance.placeTestnetOrderDrySafe({ symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', qty: 0.001 })));
app.get('/api/binance/symbol-filters/:pair', async (q, res) => res.json(await binance.validateOrderByFilters(String(q.params.pair || 'BTCUSDT').toUpperCase(), 0.001, 1000)));

app.post('/api/report', (_q, res) => { const config = readJson('config'); const runtime = readJson('runtime'); const market = readJson('market'); const trades = readJson('trades'); const logs = readJson('logs'); res.json({ ok: true, report: createReport({ config, runtime, market, trades, logs, lastSuggested }) }); });

app.listen(3000, () => console.log('Local AI Trading Terminal on http://localhost:3000'));
