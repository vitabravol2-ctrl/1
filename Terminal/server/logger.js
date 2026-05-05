const store = require('./store');

const dedupe = new Set();

function logError(source, message) {
  const key = `${source}:${message}`;
  if (dedupe.has(key)) return;
  dedupe.add(key);

  const logs = store.read('logs');
  logs.push({ time: new Date().toISOString(), level: 'ERROR', source, message });
  store.write('logs', logs.slice(-500));

  const state = store.read('state');
  state.errors = (state.errors || []).concat({ time: new Date().toISOString(), message }).slice(-50);
  store.write('state', state);
}

module.exports = { logError };
