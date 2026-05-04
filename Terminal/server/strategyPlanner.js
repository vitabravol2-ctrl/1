const { getStrategyById } = require('./strategyLibrary');

function createPlan({ pair, strategyId, overrides = {}, config, riskGuard }) {
  const strategy = getStrategyById(strategyId);
  if (!strategy) throw new Error('Strategy not found');
  const settings = { ...strategy.defaultSettings, ...overrides };
  const plan = {
    id: `plan_${Date.now()}`,
    pair,
    strategyId: strategy.id,
    strategyName: strategy.name,
    settings,
    mode: 'DRY_RUN',
    liveTradingBlocked: true,
    riskCheck: riskGuard({ pair, settings }, config),
    status: 'WAITING_CONFIRMATION',
    createdAt: new Date().toISOString()
  };
  return plan;
}

module.exports = { createPlan };
