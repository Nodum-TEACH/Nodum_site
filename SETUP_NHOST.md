# Инструкция по развёртыванию Nhost + Telegram-бот

Что делает этот бэкенд:
- Сохраняет лиды из AI-чата и классической формы (PostgreSQL)
- Скрывает AI-ключи и системный промпт от браузера (chat-proxy)
- Отслеживает просмотры страниц и CTA-клики
- Отправляет уведомления о новых заявках в Telegram-тему

**Требования к серверу:** Ubuntu 20.04+, Docker + Docker Compose v2, Caddy уже запущен, домен `nhost.weebx.duckdns.org` указывает на этот сервер.

---

## Шаг 1. Создать Telegram-бота и настроить уведомления

### 1a. Создать бота

1. Открыть Telegram → [@BotFather](https://t.me/BotFather)
2. Написать `/newbot`
3. Придумать **имя** (отображается в чате): например `Nodum Leads`
4. Придумать **username** (латиница, оканчивается на `_bot`): например `nodum_leads_bot`
5. BotFather пришлёт **токен** вида:
   ```
   7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   Сохранить — это `TELEGRAM_BOT_TOKEN`.

### 1b. Добавить бота в группу

1. Открыть нужную группу → добавить `@nodum_leads_bot` как участника
2. Назначить его **администратором** (иначе не сможет писать в темы)

### 1c. Узнать chat_id группы

Отправить любое сообщение в группу, затем открыть в браузере:

```
https://api.telegram.org/bot<ТОКЕН>/getUpdates
```

В ответе найти блок `"chat"`:
```json
"chat": {
  "id": -1001234567890,
  "title": "Nodum Team",
  "type": "supergroup"
}
```

Число `-1001234567890` (с минусом) — это `TELEGRAM_CHAT_ID`.

### 1d. Узнать ID нужной темы

Отправить сообщение **именно в ту тему**, куда должны приходить лиды, затем снова открыть `getUpdates`. В ответе найти:

```json
"message": {
  "message_thread_id": 123,
  ...
}
```

Это `TELEGRAM_THREAD_ID`. Если темы не используются — пропустить этот шаг.

Альтернативный способ: открыть группу в [web.telegram.org](https://web.telegram.org), перейти в нужную тему — в URL будет:
```
https://web.telegram.org/k/#-1001234567890_123
                                              ^^^
                                        это thread_id
```

### 1e. Проверить что всё работает

```bash
curl -X POST "https://api.telegram.org/bot<ТОКЕН>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": -1001234567890,
    "message_thread_id": 123,
    "text": "Тест — бот работает!",
    "parse_mode": "Markdown"
  }'
```

Если в теме появилось сообщение — готово.

---

## Шаг 2. Установить Docker (если не установлен)

```bash
docker --version && docker compose version

# Если нет:
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## Шаг 3. Развернуть Nhost

```bash
git clone https://github.com/nhost/nhost /opt/nhost
cd /opt/nhost
cp .env.example .env
nano .env
```

Заполнить `.env`:

```dotenv
# --- PostgreSQL ---
POSTGRES_PASSWORD=ПРИДУМАТЬ_СЛОЖНЫЙ_ПАРОЛЬ

# --- Hasura ---
HASURA_GRAPHQL_ADMIN_SECRET=ПРИДУМАТЬ_СЕКРЕТ_32_СИМВОЛА
HASURA_GRAPHQL_JWT_SECRET='{"type":"HS256","key":"ПРИДУМАТЬ_СЛУЧАЙНУЮ_СТРОКУ_32_СИМВОЛА"}'

# --- AI Models ---
LM_STUDIO_URL=https://weebx.duckdns.org
LM_STUDIO_API_KEY=sk-lm-MnP7r7Dl:h2ZafXVv77GKbgKwcH8Q
LM_STUDIO_MODEL=google/gemma-4-e4b

GEMINI_API_KEY=AIzaSyC2tAVEOCa6_lpmeawg-Mk_Ra8_t_Mz-bQ

# --- Системный промпт Вити (однострочный, \n вместо переносов строк) ---
# Взять из git-истории: git show HEAD~1:script.js | grep -A 120 'Unified AI API'
VITYA_SYSTEM_PROMPT=<identity>\nТы — Витя, дружелюбный ассистент компании Nodum.tech...\n</identity>

# --- Nhost internals ---
NHOST_GRAPHQL_URL=http://graphql-engine:8080/v1/graphql
HASURA_GRAPHQL_ADMIN_SECRET=ТОТ_ЖЕ_СЕКРЕТ_ЧТО_ВЫШЕ

# --- Telegram ---
TELEGRAM_BOT_TOKEN=7123456789:AAF...     # из шага 1a
TELEGRAM_CHAT_ID=-1001234567890          # из шага 1c
TELEGRAM_THREAD_ID=123                   # из шага 1d (убрать строку если без тем)
```

> **Важно:** `VITYA_SYSTEM_PROMPT` — полный системный промпт одной строкой. Взять из git-истории ветки `claude/dazzling-jang`:
> ```bash
> git show HEAD:script.js | grep -A 5 'Unified AI API'
> # Или посмотреть коммит до наших изменений:
> git log --oneline | head -5
> git show <хэш_старого_коммита>:script.js | grep -A 130 'callMistralAPI'
> ```

Запустить:

```bash
cd /opt/nhost
docker compose up -d
docker compose ps   # все должны быть running
```

---

## Шаг 4. Создать таблицы в базе данных

```bash
# Путь к репозиторию сайта — замените на реальный
SITE_REPO=/opt/nodum-site

docker exec -i nhost-postgres-1 psql -U postgres -d postgres \
  < $SITE_REPO/nhost/migrations/default/1_init_tables/up.sql
```

---

## Шаг 5. Настроить Hasura Console

Открыть в браузере: `http://<IP_СЕРВЕРА>:8080`
Ввести `HASURA_GRAPHQL_ADMIN_SECRET` из `.env`.

### 5a. Трекинг таблиц

Data → Schema: public → отметить `leads`, `page_views`, `cta_events` → **Track All**

### 5b. Разрешения (INSERT only для публичного доступа)

Для каждой таблицы: вкладка **Permissions** → роль `public`:

| Таблица | Разрешить | Колонки при INSERT |
|---------|-----------|-------------------|
| `leads` | INSERT | source, field, contact, message, business_size, pain_points, bot_interests, chat_history, selected_plan, messages_count, session_duration_sec, device_type, language, referrer, utm_source, utm_medium, utm_campaign |
| `page_views` | INSERT | referrer, utm_source, utm_medium, utm_campaign, user_agent |
| `cta_events` | INSERT | button_name |

SELECT / UPDATE / DELETE — **запретить** для всех трёх.

---

## Шаг 6. Развернуть Nhost Functions

```bash
SITE_REPO=/opt/nodum-site

cp $SITE_REPO/nhost/functions/chat-proxy.ts     /opt/nhost/functions/
cp $SITE_REPO/nhost/functions/save-lead-form.ts /opt/nhost/functions/
cp $SITE_REPO/nhost/functions/package.json      /opt/nhost/functions/

cd /opt/nhost
docker compose restart functions

# Подождать ~30 секунд и проверить логи
docker compose logs functions --tail=20
```

---

## Шаг 7. Обновить Caddyfile

Добавить в конфиг Caddy (обычно `/etc/caddy/Caddyfile`):

```caddyfile
# ---- LM Studio proxy ----
weebx.duckdns.org {
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }

    @options { method OPTIONS }
    handle @options {
        header {
            Access-Control-Allow-Origin "https://nodum-teach.github.io"
            Access-Control-Allow-Methods "POST, OPTIONS"
            Access-Control-Allow-Headers "Content-Type, Authorization"
        }
        respond 204
    }

    reverse_proxy 198.18.0.1:1236 {
        header_down Access-Control-Allow-Origin "https://nodum-teach.github.io"
        header_down Access-Control-Allow-Methods "POST, OPTIONS"
        header_down Access-Control-Allow-Headers "Content-Type, Authorization"
    }
}

# ---- Nhost (Hasura + Functions + GraphQL) ----
nhost.weebx.duckdns.org {
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }

    @options { method OPTIONS }
    handle @options {
        header {
            Access-Control-Allow-Origin "https://nodum-teach.github.io"
            Access-Control-Allow-Methods "POST, GET, OPTIONS"
            Access-Control-Allow-Headers "Content-Type, Authorization, x-hasura-role"
        }
        respond 204
    }

    reverse_proxy localhost:1337 {
        header_down Access-Control-Allow-Origin "https://nodum-teach.github.io"
        header_down Access-Control-Allow-Methods "POST, GET, OPTIONS"
        header_down Access-Control-Allow-Headers "Content-Type, Authorization, x-hasura-role"
    }
}
```

```bash
sudo systemctl reload caddy
# или: caddy reload --config /etc/caddy/Caddyfile
```

---

## Шаг 8. Полное тестирование

### Проверить домен

```bash
curl -s -o /dev/null -w "%{http_code}" https://nhost.weebx.duckdns.org/healthz
# → 200
```

### Тест трекинга просмотра страницы

```bash
curl -s -X POST https://nhost.weebx.duckdns.org/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation{insert_page_views_one(object:{referrer:\"test\",user_agent:\"curl\"}){id}}"}'
# → {"data":{"insert_page_views_one":{"id":"..."}}}
```

### Тест CTA-клика

```bash
curl -s -X POST https://nhost.weebx.duckdns.org/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation{insert_cta_events_one(object:{button_name:\"test\"}){id}}"}'
```

### Тест AI-прокси (чат)

```bash
curl -s -X POST https://nhost.weebx.duckdns.org/v1/functions/chat-proxy \
  -H "Content-Type: application/json" \
  -d '{"message":"Привет","chatHistory":[],"sessionMeta":{"device_type":"desktop"}}'
# → {"reply":"...текст от Вити...","leadSaved":false}
```

### Тест сохранения лида + Telegram

```bash
curl -s -X POST https://nhost.weebx.duckdns.org/v1/functions/save-lead-form \
  -H "Content-Type: application/json" \
  -d '{
    "field": "Тест — салон красоты",
    "contact": "@test_user",
    "message": "Тестовая заявка",
    "sessionMeta": {"utm_source":"test","device_type":"desktop"}
  }'
# → {"ok":true}
# И в Telegram-теме должно прийти уведомление
```

### Посмотреть записи в БД

```bash
docker exec nhost-postgres-1 psql -U postgres -d postgres \
  -c "SELECT source, field, contact, created_at FROM leads ORDER BY created_at DESC LIMIT 5;"
```

---

## Диагностика

```bash
# Логи всех контейнеров
docker compose -f /opt/nhost/docker-compose.yml logs --tail=50

# Логи функций
docker compose -f /opt/nhost/docker-compose.yml logs functions --tail=50

# Статус Caddy
sudo systemctl status caddy
sudo journalctl -u caddy --since "5 minutes ago"

# Открытые порты
ss -tlnp | grep -E '1337|8080|5432'
```

**Частые проблемы:**

| Проблема | Решение |
|----------|---------|
| `404` на `/v1/functions/...` | Функции не скопированы или контейнер не перезапущен (`docker compose restart functions`) |
| `500` в chat-proxy | `VITYA_SYSTEM_PROMPT` пустой или не заполнен в `.env` |
| Telegram не пишет | Бот не администратор группы; неверный `TELEGRAM_CHAT_ID` или `TELEGRAM_THREAD_ID` |
| Бот пишет в общий чат, не в тему | Не указан или неверный `TELEGRAM_THREAD_ID` |
| CORS ошибка в браузере | Проверить домен GitHub Pages в Caddyfile |
| `field 'leads' not found` в GraphQL | Таблица не отслеживается — шаг 5a (Track tables) |
| Hasura не видит таблицы | Миграция не применилась — повторить шаг 4 |
