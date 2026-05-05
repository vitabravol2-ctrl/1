const WebSocket = require('ws');
const { logError } = require('./logger');

class PriceSocket {
  constructor() {
    this.market = { pair: 'BTCUSDT', price: 0, bid: 0, ask: 0, spread: 0, socketStatus: 'DISCONNECTED' };
    this.ws = null;
    this.timer = null;
  }

  start(pair = 'BTCUSDT') {
    this.market.pair = pair.toUpperCase();
    this.connect();
  }

  connect() {
    const symbol = this.market.pair.toLowerCase();
    this.market.socketStatus = 'CONNECTING';
    this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@bookTicker`);

    this.ws.on('message', raw => {
      const d = JSON.parse(raw.toString());
      this.market.bid = Number(d.b);
      this.market.ask = Number(d.a);
      this.market.price = this.market.ask || this.market.bid;
      this.market.spread = this.market.ask - this.market.bid;
      this.market.socketStatus = 'CONNECTED';
    });

    this.ws.on('close', () => {
      this.market.socketStatus = 'RECONNECTING';
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.connect(), 2000);
    });

    this.ws.on('error', err => {
      logError('WebSocket', err.message);
      this.market.socketStatus = 'ERROR';
    });
  }

  getMarket() { return this.market; }
}

module.exports = new PriceSocket();
