const express = require('express');
const path = require('path');
const store = require('./store');
const { logError } = require('./logger');
const binance = require('./binanceClient');
const priceSocket = require('./priceSocket');
const ScalpingBot = require('./scalpingBot');

store.ensure();
priceSocket.start('BTCUSDT');
const bot = new ScalpingBot(priceSocket);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'web')));

app.get('/api/status', (_, res) => res.json({ ok: true, version: '1.0.0' }));
app.get('/api/settings', (_, res) => res.json(store.read('config')));
app.post('/api/save-settings', (req, res) => { const c = { ...store.read('config'), ...req.body }; store.write('config', c); res.json({ ok: true }); });
app.get('/api/market', (_, res) => res.json(priceSocket.getMarket()));
app.get('/api/state', (_, res) => res.json(store.read('state')));
app.get('/api/trades', (_, res) => res.json(store.read('trades')));
app.get('/api/logs', (_, res) => res.json(store.read('logs')));

app.post('/api/connect', async (req, res) => {
  const { apiKey, apiSecret, useTestnet } = req.body;
  try {
    const secrets = { apiKey, apiSecret, useTestnet: useTestnet !== false };
    store.write('secrets', secrets);
    await binance.ping(secrets.useTestnet);
    const acc = await binance.accountInfo(secrets);
    const usdt = (acc.balances || []).find(b => b.asset === 'USDT');

    const state = store.read('state');
    state.connectionStatus = 'CONNECTED';
    state.accountBalance = Number(usdt?.free || 0);
    store.write('state', state);
    res.json({ ok: true, balance: state.accountBalance, mode: secrets.useTestnet ? 'TESTNET' : 'LIVE' });
  } catch (e) {
    logError('connect', e.message);
    const state = store.read('state');
    state.connectionStatus = 'ERROR';
    store.write('state', state);
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.post('/api/start', (_, res) => { bot.start(); res.json({ ok: true }); });
app.post('/api/pause', (_, res) => { bot.pause(); res.json({ ok: true }); });
app.post('/api/resume', (_, res) => { bot.resume(); res.json({ ok: true }); });
app.post('/api/stop', (_, res) => { bot.stop(); res.json({ ok: true }); });
app.post('/api/emergency-stop', (_, res) => { bot.emergencyStop(); res.json({ ok: true }); });

app.get('*', (_, res) => res.sendFile(path.join(__dirname, '..', 'web', 'index.html')));

app.listen(3000, () => console.log('Terminal running on http://localhost:3000'));
