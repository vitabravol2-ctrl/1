const axios = require('axios');
const crypto = require('crypto');

function apiBase(useTestnet) {
  return useTestnet ? 'https://testnet.binance.vision' : 'https://api.binance.com';
}

async function ping(useTestnet) {
  await axios.get(`${apiBase(useTestnet)}/api/v3/ping`, { timeout: 5000 });
}

async function accountInfo({ apiKey, apiSecret, useTestnet }) {
  const timestamp = Date.now();
  const query = `timestamp=${timestamp}`;
  const signature = crypto.createHmac('sha256', apiSecret).update(query).digest('hex');
  const url = `${apiBase(useTestnet)}/api/v3/account?${query}&signature=${signature}`;
  const res = await axios.get(url, { headers: { 'X-MBX-APIKEY': apiKey }, timeout: 8000 });
  return res.data;
}

module.exports = { ping, accountInfo };
