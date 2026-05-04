const { readJson, writeJson } = require('./store');

function remember(eventType, pair, userCommand, result, feedback = '') {
  const memory = readJson('memory');
  memory.push({ time: new Date().toISOString(), eventType, pair, userCommand, result, feedback });
  writeJson('memory', memory.slice(-300));
}

module.exports = { remember };
