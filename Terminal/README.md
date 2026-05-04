# Local AI Trading Terminal v0.2.1 (REAL MARKET + GPT AGENT)

Локальный терминал с **реальными публичными данными Binance** и AI-агентом через OpenAI API, при этом сделки остаются только в **DRY-RUN**.

## Запуск
1. Откройте папку `Terminal`.
2. Выполните установку зависимостей:
   - `npm install`
3. (Опционально для GPT) создайте `.env` в папке `Terminal` и добавьте:
   - `OPENAI_API_KEY=ваш_ключ`
4. Запустите `START.bat` (или `npm start`).
5. Откройте `http://localhost:3000`.

Если `OPENAI_API_KEY` отсутствует или OpenAI SDK недоступен, сервер **не падает**, а AI работает в режиме **SIM**.

## Market Data (Binance public only)
Подключены только public endpoints Binance (без ключей и без ордеров):
- ticker price
- bookTicker bid/ask
- 24h ticker
- klines: 1m / 5m / 15m

В UI показываются:
- Price
- Bid
- Ask
- Spread
- 24h Change
- Volume
- Volatility
- Trend

Если Binance недоступен (например, нет интернета), автоматически включается **FALLBACK DEMO**.

## Проверка Binance
- Нажмите кнопку **Test Binance**.
- Статус должен показывать `BINANCE OK` или `FALLBACK DEMO`.
- Для BTCUSDT должны приходить реальные цены при доступном интернете.

## Проверка GPT
- Убедитесь, что выполнен `npm install`.
- Для режима GPT укажите `OPENAI_API_KEY` в `.env`.
- Нажмите кнопку **Test GPT**.
- Можно отправить в чат: `какие стратегии предложишь?`
- Агент получает datapack рынка и возвращает безопасный JSON-ответ.
- Без ключа AI Mode будет **SIM**.

## Безопасность
- Binance private/live endpoints: **LOCKED**.
- Реальные ордера: **запрещены**.
- GPT не может запускать торговлю напрямую.
- Запуск стратегии только через `plan` + `riskGuard` + `Confirm`.
- DRY-RUN всегда виден в интерфейсе.

## Logs
Ошибки пишутся только в `data/logs.json`.
