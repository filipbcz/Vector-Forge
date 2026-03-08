# Home Assistant OpenClaw Add-on v3

Tento add-on přijímá hlasový/textový úkol z Home Assistantu a doručí ho **přímo do OpenClaw Gateway RPC** (primárně přes OpenResponses API), takže se úkol zpracuje agentem bez Telegram „okliky“.

## Co je nově ve v3

- nový default režim: `mode: gateway_rpc`
- nový dispatch klient s retry + timeout + diagnostikou
- preferovaná metoda: `gateway_method: openresponses`
- kompatibilní fallback: `mode: telegram` nebo `telegram_forward: true`
- backward compatibility pro staré klíče `openclaw_*` (deprecated)

---

## Přesné copy-paste nastavení pro Filipa

> Vlož do konfigurace add-onu přesně toto (uprav jen URL/token/target):

```yaml
mode: gateway_rpc
gateway_url: "http://host.docker.internal:18789"
gateway_token: "<OPENCLAW_GATEWAY_TOKEN>"
gateway_method: "openresponses"
gateway_target: "telegram:5873857816"
agent_id: "main"
session_key: ""
account_id: "default"
channel: "telegram"
debug_logging: true
telegram_forward: false
telegram_bot_token: ""
telegram_chat_id: ""
ha_shared_token: "<VOLITELNÝ_SDÍLENÝ_TOKEN>"
listen_port: 8099
http_timeout_seconds: 20
dispatch_retries: 2
retry_backoff_seconds: 1
```

---

## Update only (co udělat po vydání)

1. **HA → Settings → Add-ons → OpenClaw Voice Task Bridge → Update**
2. Otevři záložku **Configuration**
3. Nahraď config podle bloku výše (hlavně `mode`, `gateway_*`)
4. Klikni **Save**
5. Klikni **Restart** add-onu
6. V záložce **Log** ověř start bez chyby
7. V HA spusť test automation (nebo ručně zavolej `rest_command`)

Hotovo. Žádný zásah do kódu není potřeba.

---

## Jak dispatch funguje

### `gateway_method: openresponses` (doporučeno)
- `POST /v1/responses`
- běží stejnou agentní cestou jako OpenClaw agent run
- při neúspěchu add-on zkusí fallback `chat_completions`

### `gateway_method: chat_completions`
- `POST /v1/chat/completions`
- při neúspěchu add-on zkusí fallback `openresponses`

### `gateway_method: tools_invoke_message`
- `POST /tools/invoke` s tool `message.send`
- kompatibilní metoda, ale není to plný agentní run endpoint

---

## API add-onu

### Health

```bash
curl http://ADDON_HOST:8099/health
```

### Task

```bash
curl -X POST http://ADDON_HOST:8099/task \
  -H "Content-Type: application/json" \
  -H "X-HA-Token: <VOLITELNÝ_TOKEN>" \
  -d '{"text":"Astra, připomeň mi zálohu serveru dnes večer"}'
```

Úspěšná odpověď obsahuje i diagnostiku (`attempted_transport`, `attempted_method`, `attempts`).

---

## Troubleshooting

| Chyba / symptom | Pravděpodobná příčina | Fix |
|---|---|---|
| `configuration_error: GATEWAY_URL is required` | Chybí `gateway_url` | Vyplň `gateway_url` v configu |
| `dispatch_error` + 401 | Špatný nebo chybějící `gateway_token` | Nastav správný token z OpenClaw Gateway |
| `dispatch_error` + 404 na `/v1/responses` | Endpoint není povolený v gateway configu | Povolit `gateway.http.endpoints.responses.enabled=true` nebo přepnout `gateway_method` |
| `dispatch_error` + 404 na `/v1/chat/completions` | Endpoint není povolený | Povolit `gateway.http.endpoints.chatCompletions.enabled=true` |
| Add-on vrací 401 na `/task` | Špatný `X-HA-Token` | Sjednotit `ha_shared_token` v add-onu a hlavičku v HA |
| Odesílá se Telegram fallback | Selhává gateway dispatch a `telegram_forward=true` | Oprav gateway URL/token/metodu, fallback nech jen jako pojistku |
| Nic se neposílá | `mode=telegram` bez telegram klíčů | Přepni na `mode=gateway_rpc` nebo doplň telegram config |

---

## Deprecated klíče (stále fungují)

Tyto klíče jsou podporované kvůli kompatibilitě, ale používej nové:

- `openclaw_base_url` → `gateway_url`
- `openclaw_token` → `gateway_token`
- `openclaw_to` → `gateway_target`
- `openclaw_channel` → `channel`
- `openclaw_account_id` → `account_id`
- `mode: gateway` → `mode: gateway_rpc`

---

## Home Assistant příklad

Viz `EXAMPLE_HOME_ASSISTANT_AUTOMATION.yaml`.
