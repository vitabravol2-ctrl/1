const dry = require('./dryRunExecutor');
const testnet = require('./testnetExecutor');
const live = require('./liveExecutor');

async function executeOrder(mode, order) {
  if (mode === 'DRY_RUN') return dry.execute(order);
  if (mode === 'TESTNET') return testnet.execute(order);
  return live.execute(order);
}

module.exports = { executeOrder };
