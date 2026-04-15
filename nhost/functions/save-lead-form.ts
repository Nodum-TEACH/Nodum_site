import type { Request, Response } from 'express'

interface LeadFormBody {
  field?: string
  contact?: string
  message?: string
  sessionMeta?: {
    utm_source?: string | null
    utm_medium?: string | null
    utm_campaign?: string | null
    referrer?: string | null
    device_type?: string
    language?: string
    session_duration_sec?: number
    selected_plan?: string | null
  }
}

async function insertLead(data: Record<string, unknown>): Promise<void> {
  const mutation = `
    mutation InsertLead($obj: leads_insert_input!) {
      insert_leads_one(object: $obj) { id }
    }
  `
  const res = await fetch(process.env.NHOST_GRAPHQL_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
    },
    body: JSON.stringify({ query: mutation, variables: { obj: data } }),
  })
  const result = await res.json()
  if (result.errors) throw new Error(JSON.stringify(result.errors))
}

async function sendTelegramNotification(lead: Record<string, unknown>): Promise<void> {
  const text = [
    `🔔 *Новая заявка* (форма)`,
    `👤 *Сфера:* ${lead.field ?? '—'}`,
    `📱 *Контакт:* ${lead.contact ?? '—'}`,
    `💬 *Сообщение:* ${lead.message ?? '—'}`,
    `📦 *Тариф смотрел:* ${lead.selected_plan ?? '—'}`,
    `🌍 *Источник:* ${lead.utm_source ?? lead.referrer ?? 'прямой переход'}`,
    `🕐 ${new Date().toLocaleString('ru-RU')}`,
  ].join('\n')

  const payload: Record<string, unknown> = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'Markdown',
  }
  if (process.env.TELEGRAM_THREAD_ID) {
    payload.message_thread_id = Number(process.env.TELEGRAM_THREAD_ID)
  }

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export default async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { field, contact, message, sessionMeta = {} } = (req.body ?? {}) as LeadFormBody

  if (!field || !contact) {
    return res.status(400).json({ error: 'field and contact are required' })
  }

  const leadData: Record<string, unknown> = {
    source: 'form',
    field,
    contact,
    message: message ?? null,
    ...sessionMeta,
  }

  try {
    await insertLead(leadData)

    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await sendTelegramNotification(leadData).catch((err: unknown) =>
        console.error('Telegram notification failed:', err),
      )
    }

    return res.json({ ok: true })
  } catch (err) {
    console.error('save-lead-form error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
