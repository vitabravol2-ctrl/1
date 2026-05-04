const { placeTestnetOrderDrySafe } = require('../binanceClient');
async function execute(order) { return placeTestnetOrderDrySafe(order); }
module.exports = { execute };
