-- Leads: client portrait collected via AI chat and traditional form
CREATE TABLE IF NOT EXISTS public.leads (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source               TEXT        NOT NULL,                 -- 'chat' | 'form'
  field                TEXT,                                 -- Сфера деятельности
  contact              TEXT,                                 -- Телефон или Telegram
  message              TEXT,                                 -- Доп. сообщение (из формы)
  business_size        TEXT,                                 -- AI: размер бизнеса
  pain_points          TEXT,                                 -- AI: боли клиента
  bot_interests        TEXT,                                 -- AI: что заинтересовало
  chat_history         JSONB,                                -- Полный диалог из чата
  selected_plan        TEXT,                                 -- Тариф, который смотрел
  messages_count       INTEGER,                              -- Кол-во сообщений в чате
  session_duration_sec INTEGER,                              -- Время на сайте (сек)
  device_type          TEXT,                                 -- 'mobile' | 'desktop' | 'tablet'
  language             TEXT,                                 -- navigator.language
  referrer             TEXT,                                 -- document.referrer
  utm_source           TEXT,
  utm_medium           TEXT,
  utm_campaign         TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Page views: anonymous visit tracking
CREATE TABLE IF NOT EXISTS public.page_views (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer     TEXT,
  utm_source   TEXT,
  utm_medium   TEXT,
  utm_campaign TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CTA events: button click tracking
CREATE TABLE IF NOT EXISTS public.cta_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  button_name TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
