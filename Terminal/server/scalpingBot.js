const store = require('./store');
const riskGuard = require('./riskGuard');

class ScalpingBot {
  constructor(priceSocket) {
    this.priceSocket = priceSocket;
    this.timer = null;
    this.cooldownUntil = 0;
  }

  start() {
    const s = store.read('state');
    s.botStatus = 'RUNNING';
    s.lastAction = 'STARTED';
    s.emergencyStop = false;
    store.write('state', s);
    this.loop();
  }

  loop() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 1000);
  }

  tick() {
    const config = store.read('config');
    const state = store.read('state');
    const market = this.priceSocket.getMarket();
    const guard = riskGuard.check({ connected: state.connectionStatus === 'CONNECTED', mode: config.mode, config, state, market, todayPnl: state.realizedPnl || 0 });
    if (!guard.ok) { state.lastAction = guard.reason; store.write('state', state); return; }
    if (Date.now() < this.cooldownUntil || state.botStatus !== 'RUNNING') return;

    if (!state.position) {
      const trigger = market.price * (1 - config.scalping.buyBelowPct / 100);
      if (market.bid <= trigger) {
        const qty = config.scalping.orderSizeUsdt / market.price;
        state.position = { side: 'BUY', qty, entryPrice: market.price, time: new Date().toISOString() };
        state.lastAction = `BUY opened (${config.mode})`;
      }
    } else {
      const tp = state.position.entryPrice * (1 + config.scalping.takeProfitPct / 100);
      const sl = state.position.entryPrice * (1 - config.scalping.stopLossPct / 100);
      const hitTp = market.ask >= tp;
      const hitSl = market.ask <= sl;
      if (hitTp || hitSl) {
        const pnl = (market.ask - state.position.entryPrice) * state.position.qty;
        const trades = store.read('trades');
        trades.push({ time: new Date().toISOString(), side: 'BUY->SELL', qty: state.position.qty, entry: state.position.entryPrice, exit: market.ask, pnl: Number(pnl.toFixed(6)), status: hitTp ? 'TP' : 'SL' });
        store.write('trades', trades.slice(-500));
        state.realizedPnl = Number((state.realizedPnl + pnl).toFixed(6));
        state.position = null;
        state.cyclesCount += 1;
        state.lastAction = hitTp ? 'Closed by TP' : 'Closed by SL';
        this.cooldownUntil = Date.now() + config.scalping.cooldownSeconds * 1000;
      }
    }

    state.currentPrice = market.price;
    if (state.position) state.unrealizedPnl = Number(((market.price - state.position.entryPrice) * state.position.qty).toFixed(6));
    else state.unrealizedPnl = 0;
    store.write('state', state);
  }

  pause() { const s = store.read('state'); s.botStatus = 'PAUSED'; s.lastAction = 'PAUSED'; store.write('state', s); }
  resume() { const s = store.read('state'); s.botStatus = 'RUNNING'; s.lastAction = 'RESUMED'; store.write('state', s); }
  stop() { clearInterval(this.timer); const s = store.read('state'); s.botStatus = 'STOPPED'; s.position = null; s.lastAction = 'STOPPED'; store.write('state', s); }
  emergencyStop() { clearInterval(this.timer); const s = store.read('state'); s.botStatus = 'STOPPED'; s.position = null; s.emergencyStop = true; s.lastAction = 'EMERGENCY_STOP'; store.write('state', s); }
}

module.exports = ScalpingBot;
