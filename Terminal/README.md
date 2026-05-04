# Local AI Trading Terminal v0.3.0

## .env setup
Copy `.env.example` to `.env` and fill keys. Secrets are loaded only from env and never shown/saved in UI/config.

## Binance Testnet
Set `BINANCE_USE_TESTNET=true` and add `BINANCE_TESTNET_API_KEY` / `BINANCE_TESTNET_API_SECRET`.

## Key checks
Use Settings buttons:
- Test Binance Public
- Test Binance Private Read-Only
- Test Binance Testnet
- Check Symbol Filters

## Why LIVE is locked
`LIVE_LOCKED` mode exists for preparation only. v0.3.0 blocks live private trading endpoints and real orders by design.

## Run DRY-RUN strategy
1. Start app (`START.bat` or `npm start`)
2. Open Settings and keep mode `DRY_RUN`
3. Click `Start Strategy` → `Confirm Plan`
4. Watch trades/PnL in runtime panels.

## Move to TESTNET
Switch mode to `TESTNET`, keep `liveTradingEnabled=false`, then run testnet checks. Orders remain dry-safe simulated wrappers until next version.
