const { readJson, writeJson } = require('./store');

const DEFAULT_DEDUP_WINDOW_MS = 60_000;

function dedupKey(type, message, details = {}) {
  const source = details?.source || 'unknown';
  return `${type}|${source}|${message}`;
}

function logError(type, message, details = {}, options = {}) {
  const now = Date.now();
  const dedupWindowMs = options.dedupWindowMs ?? DEFAULT_DEDUP_WINDOW_MS;
  const currentLogs = readJson('logs');
  const logs = Array.isArray(currentLogs) ? currentLogs : [];
  if (!Array.isArray(currentLogs)) writeJson('logs', []);
  const key = dedupKey(type, message, details);
  const duplicate = logs.findLast((entry) => {
    if (!entry?.dedupKey || entry.dedupKey !== key) return false;
    return now - new Date(entry.time).getTime() < dedupWindowMs;
  });
  if (duplicate) return false;

  logs.push({
    time: new Date(now).toISOString(),
    type,
    message,
    details,
    dedupKey: key
  });
  writeJson('logs', logs.slice(-200));
  return true;
}

module.exports = { logError };
