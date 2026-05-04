const { readJson, writeJson } = require('./store');

function logError(type, message, details = {}) {
  const logs = readJson('logs');
  logs.push({ time: new Date().toISOString(), type, message, details });
  writeJson('logs', logs.slice(-200));
}

module.exports = { logError };
