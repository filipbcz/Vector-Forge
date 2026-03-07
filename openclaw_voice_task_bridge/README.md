# Home Assistant OpenClaw Add-on (MVP)

Tento add-on umožňuje z Home Assistant automatizace poslat hlasový/tekstový úkol Astře přes Telegram Bot API.

## Co umí

- `POST /task` přijímá JSON `{ "text": "..." }`
- zprávu přepošle do Telegram chatu jako `[HA Voice Task] ...`
- `GET /health` vrací stav add-onu
- volitelná ochrana přes hlavičku `X-HA-Token`

## Konfigurace add-onu

V UI Home Assistant add-onu nastavte:

- `telegram_bot_token` – token Telegram bota
- `telegram_chat_id` – cílový chat (user/group/channel)
- `ha_shared_token` – volitelný shared secret; pokud je vyplněn, endpoint `/task` vyžaduje `X-HA-Token`
- `listen_port` – port HTTP služby (výchozí `8099`)

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

Viz soubor `EXAMPLE_HOME_ASSISTANT_AUTOMATION.yaml` s ukázkou `rest_command` + automatizace.

## Poznámka k ikonám

`icon.png` a `logo.png` nejsou pro funkční MVP nutné. V tomto kroku nejsou přidány (placeholder). Add-on funguje i bez nich.
