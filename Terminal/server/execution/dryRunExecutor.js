function execute(order) {
  return { ok: true, mode: 'DRY_RUN', order, status: 'FILLED_VIRTUAL' };
}
module.exports = { execute };
