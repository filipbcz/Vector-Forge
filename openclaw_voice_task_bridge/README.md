# Home Assistant OpenClaw Add-on v2

Tento add-on přijímá hlasový/textový úkol z Home Assistantu a **primárně ho posílá do OpenClaw Gateway jako skutečný inbound message pro agenta** (ne pouze Telegram `sendMessage`).

## Co umí

- `POST /task` přijímá JSON `{ "text": "..." }`
- **gateway mode (default):** odešle úkol přes HTTP na OpenClaw Gateway endpoint pro message dispatch
- volitelný fallback: `telegram_forward: true` (když gateway selže)
- alternativně `mode: telegram` (legacy chování)
- `GET /health` vrací stav add-onu
- volitelná ochrana přes hlavičku `X-HA-Token`

## Režimy

### 1) `mode: gateway` (doporučeno, výchozí)

Úkol jde do OpenClaw Gateway jako inbound zpráva => spustí se standardní agentní zpracování (session, routing, tools, odpověď přes kanál).

Nutné vyplnit:

- `openclaw_base_url` (např. `http://host.docker.internal:18789`)
- `openclaw_to` (např. `telegram:5873857816`)

Volitelně:

- `openclaw_token`
- `openclaw_channel` (default `telegram`)
- `openclaw_account_id` (default `default`)
- `telegram_forward: true` + `telegram_*` pro fallback

### 2) `mode: telegram`

Legacy fallback režim: odešle text přímo přes Telegram Bot API (`sendMessage`).

Nutné vyplnit:

- `telegram_bot_token`
- `telegram_chat_id`

## Konfigurace add-onu (options)

- `mode`: `gateway` | `telegram` (default `gateway`)
- `openclaw_base_url`: base URL OpenClaw Gateway HTTP API
- `openclaw_token`: volitelný bearer token
- `openclaw_to`: cíl zprávy (např. `telegram:5873857816`)
- `openclaw_channel`: výchozí `telegram`
- `openclaw_account_id`: výchozí `default`
- `telegram_forward`: volitelný fallback při selhání gateway dispatch
- `telegram_bot_token`: Telegram bot token (pro telegram mode/fallback)
- `telegram_chat_id`: cílový Telegram chat (pro telegram mode/fallback)
- `ha_shared_token`: volitelný shared secret; pokud je vyplněn, endpoint `/task` vyžaduje `X-HA-Token`
- `listen_port`: port HTTP služby (výchozí `8099`)

## API

### GET /health

```bash
curl http://ADDON_HOST:8099/health
```

Příklad odpovědi:

```json
{"status":"ok"}
```

### POST /task

```bash
curl -X POST http://ADDON_HOST:8099/task \
  -H "Content-Type: application/json" \
  -H "X-HA-Token: YOUR_SHARED_TOKEN" \
  -d '{"text":"Astra, připomeň mi zálohu serveru dnes večer"}'
```

## Integrace do Home Assistant

Viz `EXAMPLE_HOME_ASSISTANT_AUTOMATION.yaml` (v2 příklad pro `rest_command` + automatizaci).

## Poznámka

Implementace používá pouze **HTTP volání** na Gateway endpoint (bez websocketu), aby byla realisticky použitelná z add-on kontejneru.
